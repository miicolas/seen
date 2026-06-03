import { useAsyncResource } from "@/hooks/use-async-resource";
import { getMovieReviews, type Review } from "@/services/reviews";
import type { MediaType } from "@/lib/tmdb";

interface MovieReviewsState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMovieReviews(
  tmdbId: number,
  mediaType: MediaType,
): MovieReviewsState {
  const {
    data: reviews,
    isLoading,
    error,
    refetch,
  } = useAsyncResource<Review[]>(
    () => getMovieReviews(tmdbId, mediaType),
    [tmdbId, mediaType],
    [],
    "Failed to load reviews",
  );

  return { reviews, isLoading, error, refetch };
}
