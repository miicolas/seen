import { useCallback, useEffect, useState } from "react";

import { errorMessage } from "@/lib/format";
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getMovieReviews(tmdbId, mediaType)
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Failed to load reviews"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tmdbId, mediaType, reloadKey]);

  return { reviews, isLoading, error, refetch };
}
