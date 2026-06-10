import type { MediaType } from "../../tmdb";
import { mediaKey, type CandidateReason } from "../shared";
import { getUserAnchors, type UserAnchor } from "./get-user-anchors";

// Below this cosine similarity an anchor explains nothing — better to return
// null than to name an unrelated title.
const MIN_ANCHOR_SIMILARITY = 0.2;

// Unit vectors → cosine similarity is the dot product.
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

// For each candidate, pick the user's positive title whose vector is most similar
// — the "Because you rated X" explanation. Candidates with no usable anchor get null.
export async function selectAnchors(
  userId: string,
  candidates: { tmdbId: number; mediaType: MediaType; embedding: number[] }[],
  now = Date.now(),
): Promise<Map<string, CandidateReason>> {
  const anchors = (await getUserAnchors(userId, now)).filter(
    (anchor): anchor is UserAnchor & { embedding: number[] } => anchor.embedding !== null,
  );
  const reasons = new Map<string, CandidateReason>();
  if (anchors.length === 0) return reasons;

  for (const candidate of candidates) {
    let best: (UserAnchor & { embedding: number[] }) | null = null;
    let bestScore = -Infinity;
    for (const anchor of anchors) {
      // Don't explain a title with itself.
      if (anchor.tmdbId === candidate.tmdbId && anchor.mediaType === candidate.mediaType) continue;
      const score = dot(candidate.embedding, anchor.embedding);
      if (score > bestScore) {
        bestScore = score;
        best = anchor;
      }
    }
    if (best && bestScore >= MIN_ANCHOR_SIMILARITY) {
      reasons.set(mediaKey(candidate.tmdbId, candidate.mediaType), {
        anchorTmdbId: best.tmdbId,
        anchorMediaType: best.mediaType,
        anchorTitle: best.title,
      });
    }
  }

  return reasons;
}
