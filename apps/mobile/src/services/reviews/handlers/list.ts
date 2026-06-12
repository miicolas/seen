import { eden, unwrapEden } from "@/lib/eden";

import type { MediaReviewsPage, PaginatedMediaRef } from "../types";

export async function getMediaReviewsPage({
  tmdbId,
  mediaType,
  limit,
  offset,
}: PaginatedMediaRef): Promise<MediaReviewsPage> {
  return unwrapEden<MediaReviewsPage>(
    eden.reviews.get({
      query: { tmdbId, mediaType, limit, offset },
    }),
  );
}
