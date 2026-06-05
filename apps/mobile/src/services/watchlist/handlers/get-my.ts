import { eden, unwrapEden } from "@/lib/eden";

import type { MediaRef, WatchlistItem } from "../types";

export async function getMyWatchlistItem({
  tmdbId,
  mediaType,
}: MediaRef): Promise<WatchlistItem | null> {
  return unwrapEden<WatchlistItem | null>(
    eden.watchlist.my.get({
      query: { tmdbId, mediaType },
    }),
  );
}
