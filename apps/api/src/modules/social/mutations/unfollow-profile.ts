import { db } from "@seen/db";
import { follows, followRequests } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { buildProfileDetail, loadProfileRow } from "../shared";

// Unfollow a profile, and cancel any outstanding follow request to it. Idempotent:
// unfollowing someone you don't follow simply returns the current profile state.
export async function unfollowProfile(viewerId: string, profileId: string) {
  const row = await loadProfileRow(profileId);

  await Promise.all([
    db
      .delete(follows)
      .where(and(eq(follows.followerId, viewerId), eq(follows.followeeId, profileId))),
    db
      .delete(followRequests)
      .where(and(eq(followRequests.requesterId, viewerId), eq(followRequests.targetId, profileId))),
  ]);

  return { profile: await buildProfileDetail(viewerId, row) };
}
