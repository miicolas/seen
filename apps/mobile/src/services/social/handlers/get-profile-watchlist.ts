import { eden, unwrapEden } from "@/lib/eden";

import type { SocialWatchlistPage } from "../types";

export function getSocialProfileWatchlist(
  profileId: string,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<SocialWatchlistPage> {
  return unwrapEden<SocialWatchlistPage>(
    eden.social.profiles[profileId].watchlist.get({ query: { limit, offset } }),
  );
}
