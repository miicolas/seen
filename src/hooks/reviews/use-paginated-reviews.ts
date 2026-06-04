import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { errorMessage } from "@/lib/format";

export interface ReviewsPage<T> {
  reviews: T[];
  count: number;
}

export interface PaginatedReviewsState<T> {
  reviews: T[];
  count: number;
  hasMore: boolean;
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;
}

/**
 * Generic paginated review list (offset/limit, dedupe, refresh/loadMore, stale
 * request guarding). Movie and episode reviews share this — they differ only in
 * the `fetchPage` fetcher and the `resetKey` that re-runs it when the target
 * (movie or episode) changes. `fetchPage` is read through a ref so its identity
 * never churns the effect.
 */
export function usePaginatedReviews<T extends { id: string }>(
  fetchPage: (offset: number, limit: number) => Promise<ReviewsPage<T>>,
  pageSize: number,
  enabled: boolean,
  resetKey: string,
): PaginatedReviewsState<T> {
  const [reviews, setReviews] = useState<T[]>([]);
  const [count, setCount] = useState(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Keep the latest fetcher in a ref so its identity never churns the effect.
  // The actual reads happen in a setTimeout/event handler, after this commits.
  const fetchPageRef = useRef(fetchPage);
  useEffect(() => {
    fetchPageRef.current = fetchPage;
  });

  const loadFirstPage = useCallback(
    async (refreshing = false) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!enabled) {
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
        const page = await fetchPageRef.current(0, pageSize);
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
    // resetKey re-runs the load when the target changes; fetchPage is read via ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, pageSize, resetKey],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadFirstPage(false);
    }, 0);
    return () => clearTimeout(timeout);
  }, [loadFirstPage]);

  const hasMore = reviews.length < count;

  const loadMore = useCallback(async () => {
    if (!enabled || isLoadingInitial || isLoadingMore || !hasMore) return;

    const offset = reviews.length;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoadingMore(true);

    try {
      const page = await fetchPageRef.current(offset, pageSize);
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
    enabled,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    pageSize,
    reviews.length,
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
