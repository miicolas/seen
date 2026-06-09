import { api, unwrapEden } from "@/lib/eden";

import type { WatchlistListInput, WatchlistPage } from "../types";

export async function getMyWatchlistPage({
  filter,
  search,
  limit,
  offset,
}: WatchlistListInput): Promise<WatchlistPage> {
  const mediaType = filter === "all" ? undefined : filter;
  const term = search?.trim();

  return unwrapEden<WatchlistPage>(
    api.watchlist.get({
      query: { mediaType, search: term || undefined, limit, offset },
    }),
  );
}
