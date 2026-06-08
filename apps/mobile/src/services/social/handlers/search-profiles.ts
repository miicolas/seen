import { eden, unwrapEden } from "@/lib/eden";

import type { SocialProfileCard } from "../types";

export function searchProfiles(
  term: string,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<SocialProfileCard[]> {
  return unwrapEden<SocialProfileCard[]>(
    eden.social.profiles.search.get({ query: { q: term, limit, offset } }),
  );
}
