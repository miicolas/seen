import { reviewKeys } from "@seen/shared";

import {
  usePaginatedReviews,
  type PaginatedReviewsState,
} from "@/hooks/reviews/use-paginated-reviews";
import type { MediaType } from "@/lib/tmdb";
import { getMediaReviewsPage, type Review } from "@/services/reviews";

const REVIEW_PAGE_SIZE = 25;

export function usePaginatedMediaReviews(
  tmdbId: number,
  mediaType: MediaType,
): PaginatedReviewsState<Review> {
  return usePaginatedReviews<Review>(
    [...reviewKeys.list(mediaType, tmdbId), "pages"] as const,
    (offset, limit) => getMediaReviewsPage({ tmdbId, mediaType, limit, offset }),
    REVIEW_PAGE_SIZE,
    Number.isFinite(tmdbId) && mediaType === "movie",
  );
}
