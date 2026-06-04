import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { errorMessage } from "@/lib/format";
import type { MediaType } from "@/lib/tmdb";
import {
  getMovieReviewRatings,
  getMovieReviewsPage,
  type MovieReviewsPage,
  type Review,
} from "@/services/reviews";

const REVIEW_PREVIEW_LIMIT = 3;
export const REVIEW_PAGE_SIZE = 25;

interface MovieReviewPreviewState {
  reviews: Review[];
  count: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface MovieReviewRatingsState {
  ratings: number[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface PaginatedMovieReviewsState {
  reviews: Review[];
  count: number;
  hasMore: boolean;
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;
}

function emptyPage(): MovieReviewsPage {
  return { reviews: [], count: 0 };
}

function canLoadReviews(tmdbId: number, mediaType: MediaType): boolean {
  return Number.isFinite(tmdbId) && mediaType === "movie";
}

export function useMovieReviewPreview(
  tmdbId: number,
  mediaType: MediaType,
): MovieReviewPreviewState {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useAsyncResource<MovieReviewsPage>(
    () =>
      canLoadReviews(tmdbId, mediaType)
        ? getMovieReviewsPage({
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

export function useMovieReviewRatings(
  tmdbId: number,
  mediaType: MediaType,
): MovieReviewRatingsState {
  const {
    data: ratings,
    isLoading,
    error,
    refetch,
  } = useAsyncResource<number[]>(
    () =>
      canLoadReviews(tmdbId, mediaType)
        ? getMovieReviewRatings({ tmdbId, mediaType })
        : Promise.resolve([]),
    [tmdbId, mediaType],
    [],
    "Failed to load review ratings",
  );

  return { ratings, isLoading, error, refetch };
}

export function usePaginatedMovieReviews(
  tmdbId: number,
  mediaType: MediaType,
): PaginatedMovieReviewsState {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [count, setCount] = useState(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const canLoad = canLoadReviews(tmdbId, mediaType);

  const loadFirstPage = useCallback(
    async (refreshing = false) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!canLoad) {
        setReviews([]);
        setCount(0);
        setError(null);
        setIsLoadingInitial(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
        return;
      }

      setIsLoadingMore(false);
      if (refreshing) setIsRefreshing(true);
      else setIsLoadingInitial(true);
      setError(null);

      try {
        const page = await getMovieReviewsPage({
          tmdbId,
          mediaType,
          limit: REVIEW_PAGE_SIZE,
          offset: 0,
        });
        if (requestIdRef.current !== requestId) return;
        setReviews(page.reviews);
        setCount(page.count);
      } catch (err) {
        if (requestIdRef.current === requestId) {
          setError(errorMessage(err, "Failed to load reviews"));
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoadingInitial(false);
          setIsRefreshing(false);
        }
      }
    },
    [canLoad, mediaType, tmdbId],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadFirstPage(false);
    }, 0);
    return () => clearTimeout(timeout);
  }, [loadFirstPage]);

  const hasMore = reviews.length < count;

  const loadMore = useCallback(async () => {
    if (!canLoad || isLoadingInitial || isLoadingMore || !hasMore) return;

    const offset = reviews.length;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoadingMore(true);

    try {
      const page = await getMovieReviewsPage({
        tmdbId,
        mediaType,
        limit: REVIEW_PAGE_SIZE,
        offset,
      });
      if (requestIdRef.current !== requestId) return;

      setCount(page.count);
      setReviews((current) => {
        const seenIds = new Set(current.map((review) => review.id));
        const nextReviews = page.reviews.filter(
          (review) => !seenIds.has(review.id),
        );
        return [...current, ...nextReviews];
      });
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setError(errorMessage(err, "Failed to load more reviews"));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoadingMore(false);
      }
    }
  }, [
    canLoad,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    mediaType,
    reviews.length,
    tmdbId,
  ]);

  const refresh = useCallback(() => {
    if (isLoadingInitial || isRefreshing) return;
    loadFirstPage(true);
  }, [isLoadingInitial, isRefreshing, loadFirstPage]);

  return useMemo(
    () => ({
      reviews,
      count,
      hasMore,
      isLoadingInitial,
      isLoadingMore,
      isRefreshing,
      error,
      refresh,
      loadMore,
    }),
    [
      count,
      error,
      hasMore,
      isLoadingInitial,
      isLoadingMore,
      isRefreshing,
      loadMore,
      refresh,
      reviews,
    ],
  );
}
