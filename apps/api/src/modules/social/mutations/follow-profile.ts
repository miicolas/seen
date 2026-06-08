import { db } from "@seen/db";
import { follows, followRequests } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";
import { buildProfileDetail, loadProfileRow } from "../shared";

// Follow a profile. `open` profiles create the follow immediately; `approval_required`
// profiles create (or re-open) a pending follow request instead.
export async function followProfile(viewerId: string, profileId: string) {
  if (viewerId === profileId) {
    throw new HttpError(400, "You can't follow yourself.", "follow-self");
  }
  const row = await loadProfileRow(profileId);

  const [alreadyFollowing] = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.followerId, viewerId), eq(follows.followeeId, profileId)))
    .limit(1);

  if (alreadyFollowing || row.followPolicy === "open") {
    await db
      .insert(follows)
      .values({ followerId: viewerId, followeeId: profileId })
      .onConflictDoNothing({ target: [follows.followerId, follows.followeeId] });
    // A previously pending request is now moot.
    await db
      .delete(followRequests)
      .where(and(eq(followRequests.requesterId, viewerId), eq(followRequests.targetId, profileId)));
    return { state: "following" as const, profile: await buildProfileDetail(viewerId, row) };
  }

  const now = new Date();

  await db
    .insert(followRequests)
    .values({ requesterId: viewerId, targetId: profileId, status: "pending" })
    .onConflictDoUpdate({
      target: [followRequests.requesterId, followRequests.targetId],
      set: { status: "pending", createdAt: now, updatedAt: now },
    });

  return { state: "requested" as const, profile: await buildProfileDetail(viewerId, row) };
}
