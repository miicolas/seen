import { eden, unwrapEden } from "@/lib/eden";

import type { SocialProfile } from "../types";

export function unfollowProfile(profileId: string): Promise<{ profile: SocialProfile }> {
  return unwrapEden<{ profile: SocialProfile }>(eden.social.profiles[profileId].follow.delete());
}
