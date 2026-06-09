import { api, unwrapEden } from "@/lib/eden";

import type { WatchlistInput, WatchlistItem } from "../types";

export async function addToWatchlist(input: WatchlistInput): Promise<WatchlistItem> {
  return unwrapEden<WatchlistItem>(api.watchlist.my.put(input));
}
