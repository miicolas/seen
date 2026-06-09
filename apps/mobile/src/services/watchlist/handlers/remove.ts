import { api, unwrapEden } from "@/lib/eden";

import type { MediaRef } from "../types";

export async function removeFromWatchlist({ tmdbId, mediaType }: MediaRef): Promise<void> {
  await unwrapEden<{ ok: boolean }>(
    api.watchlist.my.delete(
      {},
      {
        query: { tmdbId, mediaType },
      },
    ),
  );
}
