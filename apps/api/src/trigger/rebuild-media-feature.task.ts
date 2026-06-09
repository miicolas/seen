import { task } from "@trigger.dev/sdk";

import { rebuildMediaFeature } from "../modules/similarity/mutations";
import type { MediaType } from "../modules/tmdb";

// Recompute and persist one title's content feature vector. Enqueued after a user
// touches a title (rate/like/dismiss/watchlist) and by the keyword backfill.
export const rebuildMediaFeatureTask = task({
  id: "rebuild-media-feature",
  run: async (payload: { tmdbId: number; mediaType: MediaType }) => {
    const embedding = await rebuildMediaFeature(payload.tmdbId, payload.mediaType);
    return { tmdbId: payload.tmdbId, mediaType: payload.mediaType, built: embedding !== null };
  },
});
