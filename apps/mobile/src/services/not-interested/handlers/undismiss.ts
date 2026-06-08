import { eden, unwrapEden } from "@/lib/eden";

import type { MediaType } from "@/lib/tmdb";

export async function undismiss({
  tmdbId,
  mediaType,
}: {
  tmdbId: number;
  mediaType: MediaType;
}): Promise<void> {
  await unwrapEden<{ ok: boolean }>(
    eden["not-interested"].my.delete(undefined, {
      query: { tmdbId, mediaType },
    }),
  );
}
