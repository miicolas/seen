import { db } from "@seen/db";
import { follows, followRequests } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";

// Approve a pending follow request addressed to the viewer: create the follow edge
// and mark the request approved.
export async function approveFollowRequest(viewerId: string, requestId: string) {
  const [request] = await db
    .select()
    .from(followRequests)
    .where(
      and(
        eq(followRequests.id, requestId),
        eq(followRequests.targetId, viewerId),
        eq(followRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (!request) {
    throw new HttpError(404, "Request not found.", "request-not-found");
  }

  await db
    .insert(follows)
    .values({ followerId: request.requesterId, followeeId: viewerId })
    .onConflictDoNothing({ target: [follows.followerId, follows.followeeId] });

  await db
    .update(followRequests)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(followRequests.id, requestId));

  return { ok: true };
}
