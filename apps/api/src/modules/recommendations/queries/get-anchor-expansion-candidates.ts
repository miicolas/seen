import { getUserAnchors } from "../../similarity/queries/get-user-anchors";
import { mediaKey, type CandidateReason } from "../../similarity/shared";
import { getMediaRecommendations } from "../../tmdb/queries/media-recommendations";
import type { MediaType } from "../../tmdb";

// TMDB-side expansion: for the user's strongest positive titles, pull TMDB's
// own "recommendations for this title" list. This works for a single user with
// a handful of ratings (no neighbors or embeddings required) and gives every
// "Because you rated X" row real depth.
const MAX_EXPANSION_ANCHORS = 6;
const PER_ANCHOR_LIMIT = 12;
const MIN_VOTE_COUNT = 50;

export type AnchorExpansionCandidate = {
  tmdbId: number;
  mediaType: MediaType;
  // Rank-decayed relevance in [0, 1]: TMDB orders by similarity/engagement.
  score: number;
  reason: CandidateReason;
};

export async function getAnchorExpansionCandidates(
  userId: string,
): Promise<AnchorExpansionCandidate[]> {
  const anchors = (await getUserAnchors(userId)).slice(0, MAX_EXPANSION_ANCHORS);
  if (anchors.length === 0) return [];

  const lists = await Promise.all(
    anchors.map(async (anchor) => ({
      anchor,
      titles: await getMediaRecommendations(anchor.mediaType, anchor.tmdbId).catch(
        () => [] as Awaited<ReturnType<typeof getMediaRecommendations>>,
      ),
    })),
  );

  const seen = new Set<string>();
  const candidates: AnchorExpansionCandidate[] = [];
  for (const { anchor, titles } of lists) {
    let rank = 0;
    for (const title of titles) {
      if (rank >= PER_ANCHOR_LIMIT) break;
      if ((title.vote_count ?? 0) < MIN_VOTE_COUNT) continue;
      const key = mediaKey(title.id, title.media_type);
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        tmdbId: title.id,
        mediaType: title.media_type,
        score: 1 - rank / PER_ANCHOR_LIMIT,
        reason: {
          anchorTmdbId: anchor.tmdbId,
          anchorMediaType: anchor.mediaType,
          anchorTitle: anchor.title,
        },
      });
      rank += 1;
    }
  }
  return candidates;
}
