import { buildActivityFeed, getFolloweeIds } from "../activity";

// The viewer's home-style feed: recent activity from everyone they follow. As a
// follower the viewer can always see followee `followers`-visible content, so no
// extra per-author visibility filtering is needed here.
export async function getFollowingActivity(viewerId: string, limit = 12, offset = 0) {
  const followeeIds = await getFolloweeIds(viewerId);
  if (followeeIds.length === 0) return [];
  return buildActivityFeed(viewerId, followeeIds, limit, offset);
}
