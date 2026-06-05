import { eden, unwrapEden } from "@/lib/eden";

import type { MediaRef } from "../types";

export async function deleteReview({ tmdbId, mediaType }: MediaRef): Promise<void> {
  await unwrapEden<{ ok: boolean }>(
    eden.reviews.my.delete(undefined, {
      query: { tmdbId, mediaType },
    }),
  );
}
