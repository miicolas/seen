import { useInfiniteQuery, type InfiniteData, type QueryKey } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { errorMessage } from "@/lib/format";

interface OffsetPaginationOptions<T> {
  queryKey: QueryKey;
  pageSize: number;
  fetchPage: (offset: number, limit: number) => Promise<T[]>;
  enabled?: boolean;
  errorFallback: string;
}

interface OffsetPaginationState<T> {
  data: T[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  error: string | null;
  refetch: () => unknown;
  loadMore: () => void;
}

function loadedItemCount<T>(pages: T[][]): number {
  return pages.reduce((total, page) => total + page.length, 0);
}

export function useOffsetPagination<T>({
  queryKey,
  pageSize,
  fetchPage,
  enabled = true,
  errorFallback,
}: OffsetPaginationOptions<T>): OffsetPaginationState<T> {
  const query = useInfiniteQuery<T[], Error, InfiniteData<T[], number>, QueryKey, number>({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam, pageSize),
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === pageSize ? loadedItemCount(allPages) : undefined,
  });

  const data = useMemo<T[]>(() => query.data?.pages.flat() ?? [], [query.data?.pages]);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    data,
    isLoading: query.isLoading,
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    error: query.error ? errorMessage(query.error, errorFallback) : null,
    refetch: query.refetch,
    loadMore,
  };
}
