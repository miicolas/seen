import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  usePaginatedReviews,
  type PaginatedReviewsState,
} from "@/hooks/reviews/use-paginated-reviews";
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
  const { data, isLoading, error, refetch } =
    useAsyncResource<MediaReviewsPage>(
      () =>
        canLoadReviews(tmdbId, mediaType)
          ? getMediaReviewsPage({
              tmdbId,
              mediaType,
              limit: REVIEW_PREVIEW_LIMIT,
              offset: 0,
            })
          : Promise.resolve(emptyPage()),
      [tmdbId, mediaType],
      emptyPage(),
      "Failed to load reviews",
    );

  return {
    reviews: data.reviews,
    count: data.count,
    isLoading,
    error,
    refetch,
  };
}

export function usePaginatedMediaReviews(
  tmdbId: number,
  mediaType: MediaType,
): PaginatedReviewsState<Review> {
  return usePaginatedReviews<Review>(
    (offset, limit) =>
      getMediaReviewsPage({ tmdbId, mediaType, limit, offset }),
    REVIEW_PAGE_SIZE,
    canLoadReviews(tmdbId, mediaType),
    `${tmdbId}:${mediaType}`,
  );
}
