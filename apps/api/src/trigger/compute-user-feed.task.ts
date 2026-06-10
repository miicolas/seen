import { task } from "@trigger.dev/sdk";

import { refreshUserFeed } from "../modules/recommendations/refresh-user-feed";

// Recompute and persist one user's "For You" feed. Enqueued (debounced) after
// signal changes; the region is resolved from the user's platforms.
export const computeUserFeedTask = task({
  id: "compute-user-feed",
  run: async (payload: { userId: string }) => {
    const entries = await refreshUserFeed(payload.userId);
    return { userId: payload.userId, entries };
  },
});
