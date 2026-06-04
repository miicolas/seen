import { eden, unwrapEden } from "@/lib/eden";

import type { MediaRef, MediaReviewStats } from "../types";

export async function getMediaStats({
  tmdbId,
  mediaType,
}: MediaRef): Promise<MediaReviewStats | null> {
  return unwrapEden<MediaReviewStats | null>(
    eden.reviews.stats.get({
      query: { tmdbId, mediaType },
    }),
  );
}
