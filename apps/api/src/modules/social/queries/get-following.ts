import { listProfileConnections } from "../shared";

export async function getFollowing(viewerId: string, profileId: string, limit = 20, offset = 0) {
  return listProfileConnections(viewerId, profileId, "following", limit, offset);
}
