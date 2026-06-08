import { eden, unwrapEden } from "@/lib/eden";

import type { SocialProfileCard } from "../types";

export function getFollowers(
  profileId: string,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<SocialProfileCard[]> {
  return unwrapEden<SocialProfileCard[]>(
    eden.social.profiles[profileId].followers.get({ query: { limit, offset } }),
  );
}
