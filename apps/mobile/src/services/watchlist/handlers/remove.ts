import { eden, unwrapEden } from "@/lib/eden";

import type { MediaRef } from "../types";

export async function removeFromWatchlist({ tmdbId, mediaType }: MediaRef): Promise<void> {
  await unwrapEden<{ ok: boolean }>(
    eden.watchlist.my.delete(undefined, {
      query: { tmdbId, mediaType },
    }),
  );
}
