import { eden, unwrapEden } from "@/lib/eden";

import type { FollowResult } from "../types";

export function followProfile(profileId: string): Promise<FollowResult> {
  return unwrapEden<FollowResult>(eden.social.profiles[profileId].follow.post());
}
