import { watchlistKeys } from "@seen/shared";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { useAuthContext } from "@/hooks/use-auth-context";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { errorMessage } from "@/lib/format";
import type { MediaFilter } from "@/lib/tmdb";
import {
  getMyWatchlistPage,
  removeFromWatchlist,
  type WatchlistItemWithMedia,
  type WatchlistPage,
} from "@/services/watchlist";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

interface WatchlistState {
  items: WatchlistItemWithMedia[];
  count: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRemoving: boolean;
  hasMore: boolean;
  error: string | null;
  remove: (item: WatchlistItemWithMedia) => Promise<void>;
  refetch: () => void;
  loadMore: () => void;
}

export function useWatchlist(filter: MediaFilter, search: string): WatchlistState {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const canLoad = !!user;

  const term = search.trim();
  const debouncedTerm = useDebouncedValue(term, term ? SEARCH_DEBOUNCE_MS : 0);
  const key = watchlistKeys.list(filter, debouncedTerm);

  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) =>
      getMyWatchlistPage({ filter, search: debouncedTerm, limit: PAGE_SIZE, offset: pageParam }),
    enabled: canLoad,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((total, page) => total + page.items.length, 0);
      return loaded < lastPage.count ? loaded : undefined;
    },
  });

  const items = useMemo(() => {
    const byId = new Map<string, WatchlistItemWithMedia>();
    for (const page of query.data?.pages ?? []) {
      for (const item of page.items) byId.set(item.id, item);
    }
    return [...byId.values()];
  }, [query.data?.pages]);

  const removeMutation = useMutation({
    mutationFn: (item: WatchlistItemWithMedia) =>
      removeFromWatchlist({ tmdbId: item.tmdb_id, mediaType: item.media_type }),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InfiniteData<WatchlistPage>>(key);
      if (previous) {
        queryClient.setQueryData<InfiniteData<WatchlistPage>>(key, {
          ...previous,
          pages: previous.pages.map((page) => ({
            count: Math.max(0, page.count - 1),
            items: page.items.filter((existing) => existing.id !== item.id),
          })),
        });
      }
      queryClient.setQueryData(watchlistKeys.my(item.media_type, item.tmdb_id), null);
      return { previous, item };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: (_data, _error, _variables, context) => {
      // Every filter/search variant is a separate cache; refresh them all.
      queryClient.invalidateQueries({ queryKey: ["watchlist", "list"] });
      if (context?.item) {
        queryClient.invalidateQueries({
          queryKey: watchlistKeys.my(context.item.media_type, context.item.tmdb_id),
        });
      }
    },
  });

  const remove = useCallback(
    async (item: WatchlistItemWithMedia) => {
      setMutationError(null);
      try {
        await removeMutation.mutateAsync(item);
      } catch (err) {
        setMutationError(errorMessage(err, "Failed to remove from Watchlist"));
        throw err;
      }
    },
    [removeMutation],
  );

  const { refetch: refetchQuery, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const refetch = useCallback(() => {
    if (canLoad) refetchQuery();
  }, [canLoad, refetchQuery]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    items,
    count: query.data?.pages[0]?.count ?? 0,
    isLoading: query.isLoading,
    isLoadingMore: isFetchingNextPage,
    isRemoving: removeMutation.isPending,
    hasMore: hasNextPage,
    error:
      mutationError ?? (query.error ? errorMessage(query.error, "Failed to load Watchlist") : null),
    remove,
    refetch,
    loadMore,
  };
}
