import { eden, unwrapEden } from "@/lib/eden";

import type {
  MediaRef,
  MediaReviewsPage,
  PaginatedMediaRef,
  Review,
} from "../types";

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

export async function getMediaReviews({
  tmdbId,
  mediaType,
}: MediaRef): Promise<Review[]> {
  const page = await getMediaReviewsPage({
    tmdbId,
    mediaType,
    limit: 3,
    offset: 0,
  });
  return page.reviews;
}
