import { listProfileConnections } from "../shared";

export async function getFollowers(viewerId: string, profileId: string, limit = 20, offset = 0) {
  return listProfileConnections(viewerId, profileId, "followers", limit, offset);
}
