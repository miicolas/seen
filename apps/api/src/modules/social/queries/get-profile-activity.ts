import { buildActivityFeed } from "../activity";
import { loadViewableProfile } from "../shared";

export async function getSocialProfileActivity(
  viewerId: string,
  profileId: string,
  limit = 12,
  offset = 0,
) {
  await loadViewableProfile(viewerId, profileId);
  return buildActivityFeed(viewerId, [profileId], limit, offset);
}
