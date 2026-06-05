import { eden, unwrapEden } from "@/lib/eden";

import type { WatchlistListInput, WatchlistPage } from "../types";

export async function getMyWatchlistPage({
  filter,
  limit,
  offset,
}: WatchlistListInput): Promise<WatchlistPage> {
  const mediaType = filter === "all" ? undefined : filter;

  return unwrapEden<WatchlistPage>(
    eden.watchlist.get({
      query: { mediaType, limit, offset },
    }),
  );
}
