import { eden, unwrapEden } from "@/lib/eden";

import type { SocialProfile } from "../types";

export function getSocialProfile(profileId: string): Promise<SocialProfile> {
  return unwrapEden<SocialProfile>(eden.social.profiles[profileId].get());
}
