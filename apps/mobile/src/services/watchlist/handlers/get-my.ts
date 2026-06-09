import { api, unwrapEden } from "@/lib/eden";

import type { MediaRef, WatchlistItem } from "../types";

export async function getMyWatchlistItem({
  tmdbId,
  mediaType,
}: MediaRef): Promise<WatchlistItem | null> {
  return unwrapEden<WatchlistItem | null>(
    api.watchlist.my.get({
      query: { tmdbId, mediaType },
    }),
  );
}
