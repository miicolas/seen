import { db } from "@seen/db";
import { followRequests } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";

// Reject a pending follow request addressed to the viewer. The row is kept as
// `rejected` (not deleted) so a re-request flips the same row, but no follow edge
// is created.
export async function rejectFollowRequest(viewerId: string, requestId: string) {
  const result = await db
    .update(followRequests)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(
      and(
        eq(followRequests.id, requestId),
        eq(followRequests.targetId, viewerId),
        eq(followRequests.status, "pending"),
      ),
    )
    .returning({ id: followRequests.id });

  if (result.length === 0) {
    throw new HttpError(404, "Request not found.", "request-not-found");
  }

  return { ok: true };
}
