import { buildProfileDetail, loadProfileRow } from "../shared";

export async function getSocialProfile(viewerId: string, profileId: string) {
  const row = await loadProfileRow(profileId);
  return buildProfileDetail(viewerId, row);
}
