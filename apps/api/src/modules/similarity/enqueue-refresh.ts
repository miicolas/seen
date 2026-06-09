import { maybeTrigger } from "../../lib/trigger";
import { ENCODER_VERSION } from "./encoder";
import { rebuildMediaFeature, rebuildUserTaste } from "./mutations";
import type { MediaRef } from "./shared";

// How long a burst of taste-affecting actions coalesces into a single rebuild.
const TASTE_BUCKET_MS = 60_000;

function runInline(label: string, work: Promise<unknown>): void {
  void work.catch((error) => console.error(`similarity: inline ${label} failed`, error));
}

// Single enqueue point for similarity rebuilds after a signal change. Media
// rebuilds are deduped per title + encoder version (the vector depends only on
// TMDB content); taste rebuilds are bucketed and delayed so a burst of actions
// collapses into one run. Without Trigger.dev configured the builders run
// inline (fire-and-forget) so local dev stays fresh.
export function enqueueSimilarityRefresh(
  userId: string,
  options: { media?: MediaRef; skipTaste?: boolean } = {},
): void {
  if (options.media) {
    const { tmdbId, mediaType } = options.media;
    const enqueued = maybeTrigger(
      "rebuild-media-feature",
      { tmdbId, mediaType },
      {
        idempotencyKey: `media:${mediaType}:${tmdbId}:v${ENCODER_VERSION}`,
        idempotencyKeyTTL: "1h",
      },
    );
    if (!enqueued) runInline("media feature rebuild", rebuildMediaFeature(tmdbId, mediaType));
  }

  if (!options.skipTaste) {
    const bucket = Math.floor(Date.now() / TASTE_BUCKET_MS);
    const enqueued = maybeTrigger(
      "rebuild-user-taste-vector",
      { userId },
      {
        idempotencyKey: `taste:${userId}:${bucket}`,
        idempotencyKeyTTL: "10m",
        delay: "1m",
      },
    );
    if (!enqueued) runInline("taste rebuild", rebuildUserTaste(userId));
  }
}
