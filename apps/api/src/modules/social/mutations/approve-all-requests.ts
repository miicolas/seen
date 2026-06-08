import { db } from "@seen/db";
import { follows, followRequests } from "@seen/db/schema";
import { and, eq, inArray } from "@seen/db/orm";

// Approve every pending follow request addressed to the viewer in one shot.
export async function approveAllFollowRequests(viewerId: string) {
  return db.transaction(async (tx) => {
    const pending = await tx
      .select({ id: followRequests.id, requesterId: followRequests.requesterId })
      .from(followRequests)
      .where(and(eq(followRequests.targetId, viewerId), eq(followRequests.status, "pending")));

    if (pending.length === 0) return { approved: 0 };

    await tx
      .insert(follows)
      .values(pending.map((request) => ({ followerId: request.requesterId, followeeId: viewerId })))
      .onConflictDoNothing({ target: [follows.followerId, follows.followeeId] });

    const updated = await tx
      .update(followRequests)
      .set({ status: "approved", updatedAt: new Date() })
      .where(
        inArray(
          followRequests.id,
          pending.map((request) => request.id),
        ),
      )
      .returning({ id: followRequests.id });

    return { approved: updated.length };
  });
}
