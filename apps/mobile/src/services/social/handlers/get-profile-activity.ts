import { eden, unwrapEden } from "@/lib/eden";

import type { SocialActivityItem } from "../types";

export function getSocialProfileActivity(
  profileId: string,
  { limit = 12, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<SocialActivityItem[]> {
  return unwrapEden<SocialActivityItem[]>(
    eden.social.profiles[profileId].activity.get({ query: { limit, offset } }),
  );
}
