import {
  useInfiniteQuery,
  type QueryKey,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

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
  queryKey: QueryKey,
  fetchPage: (offset: number, limit: number) => Promise<ReviewsPage<T>>,
  pageSize: number,
  enabled: boolean,
): PaginatedReviewsState<T> {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam, pageSize),
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (total, page) => total + page.reviews.length,
        0,
      );
      return loaded < lastPage.count ? loaded : undefined;
    },
  });

  const reviews = useMemo(() => {
    const byId = new Map<string, T>();
    for (const page of query.data?.pages ?? []) {
      for (const review of page.reviews) byId.set(review.id, review);
    }
    return [...byId.values()];
  }, [query.data?.pages]);

  const refresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  const count = query.data?.pages[0]?.count ?? 0;

  return useMemo(
    () => ({
      reviews,
      count,
      hasMore: reviews.length < count,
      isLoadingInitial: query.isLoading,
      isLoadingMore: query.isFetchingNextPage,
      isRefreshing: query.isRefetching && !query.isFetchingNextPage,
      error: query.error
        ? errorMessage(query.error, "Failed to load reviews")
        : null,
      refresh,
      loadMore,
    }),
    [
      count,
      loadMore,
      query.error,
      query.isFetchingNextPage,
      query.isLoading,
      query.isRefetching,
      refresh,
      reviews,
    ],
  );
}
