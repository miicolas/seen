import { profileKeys } from "@seen/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { errorMessage } from "@/lib/format";
import { getMyProfileActivity, type ProfileActivityItem } from "@/services/profiles";

const PAGE_SIZE = 12;

export function useProfileActivity() {
  const query = useInfiniteQuery({
    queryKey: [...profileKeys.activity(), PAGE_SIZE] as const,
    queryFn: ({ pageParam }) => getMyProfileActivity({ limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE
        ? allPages.reduce((total, page) => total + page.length, 0)
        : undefined,
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = query;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    data: query.data?.pages.flat() ?? [],
    isLoading: query.isLoading,
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    error: query.error ? errorMessage(query.error, "Couldn't load your activity.") : null,
    refetch,
    loadMore,
  } satisfies {
    data: ProfileActivityItem[];
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    error: string | null;
    refetch: () => unknown;
    loadMore: () => void;
  };
}
