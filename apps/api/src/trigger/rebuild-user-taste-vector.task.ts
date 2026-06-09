import { task } from "@trigger.dev/sdk";

import { rebuildUserTaste } from "../modules/similarity/mutations";

// Recompute and persist a user's taste vector from their current signals.
// Enqueued after any signal change; the row is deleted when no usable vector
// remains.
export const rebuildUserTasteVectorTask = task({
  id: "rebuild-user-taste-vector",
  run: async (payload: { userId: string }) => {
    const embedding = await rebuildUserTaste(payload.userId);
    return { userId: payload.userId, built: embedding !== null };
  },
});
