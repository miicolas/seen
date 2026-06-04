import { reviewKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import {
  usePaginatedReviews,
  type PaginatedReviewsState,
} from "@/hooks/reviews/use-paginated-reviews";
import { errorMessage } from "@/lib/format";
import type { MediaType } from "@/lib/tmdb";
import {
  getMediaReviewsPage,
  type MediaReviewsPage,
  type Review,
} from "@/services/reviews";

const REVIEW_PREVIEW_LIMIT = 3;
export const REVIEW_PAGE_SIZE = 25;

interface MediaReviewPreviewState {
  reviews: Review[];
  count: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

function emptyPage(): MediaReviewsPage {
  return { reviews: [], count: 0 };
}

function canLoadReviews(tmdbId: number, mediaType: MediaType): boolean {
  return Number.isFinite(tmdbId) && mediaType === "movie";
}

export function useMediaReviewPreview(
  tmdbId: number,
  mediaType: MediaType,
): MediaReviewPreviewState {
  const query = useQuery({
    queryKey: reviewKeys.list(mediaType, tmdbId),
    queryFn: () =>
      getMediaReviewsPage({
        tmdbId,
        mediaType,
        limit: REVIEW_PREVIEW_LIMIT,
        offset: 0,
      }),
    enabled: canLoadReviews(tmdbId, mediaType),
  });
  const data = query.data ?? emptyPage();

  return {
    reviews: data.reviews,
    count: data.count,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Failed to load reviews") : null,
    refetch: () => {
      query.refetch();
    },
  };
}

export function usePaginatedMediaReviews(
  tmdbId: number,
  mediaType: MediaType,
): PaginatedReviewsState<Review> {
  return usePaginatedReviews<Review>(
    [...reviewKeys.list(mediaType, tmdbId), "pages"] as const,
    (offset, limit) =>
      getMediaReviewsPage({ tmdbId, mediaType, limit, offset }),
    REVIEW_PAGE_SIZE,
    canLoadReviews(tmdbId, mediaType),
  );
}
