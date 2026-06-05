import { watchlistKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useAuthContext } from "@/hooks/use-auth-context";
import { errorMessage } from "@/lib/format";
import type { MediaFilter } from "@/lib/tmdb";
import {
  getMyWatchlistPage,
  removeFromWatchlist,
  type WatchlistItemWithMedia,
  type WatchlistPage,
} from "@/services/watchlist";

const PAGE_SIZE = 50;

interface WatchlistState {
  items: WatchlistItemWithMedia[];
  count: number;
  isLoading: boolean;
  isRemoving: boolean;
  error: string | null;
  remove: (item: WatchlistItemWithMedia) => Promise<void>;
  refetch: () => void;
}

export function useWatchlist(filter: MediaFilter): WatchlistState {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const canLoad = !!user;
  const key = watchlistKeys.list(filter);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getMyWatchlistPage({ filter, limit: PAGE_SIZE, offset: 0 }),
    enabled: canLoad,
  });
  const refetchQuery = query.refetch;

  const removeMutation = useMutation({
    mutationFn: (item: WatchlistItemWithMedia) =>
      removeFromWatchlist({ tmdbId: item.tmdb_id, mediaType: item.media_type }),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WatchlistPage>(key);
      if (previous) {
        queryClient.setQueryData<WatchlistPage>(key, {
          count: Math.max(0, previous.count - 1),
          items: previous.items.filter((existing) => existing.id !== item.id),
        });
      }
      queryClient.setQueryData(watchlistKeys.my(item.media_type, item.tmdb_id), null);
      return { previous, item };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: (_data, _error, _variables, context) => {
      queryClient.invalidateQueries({ queryKey: key });
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

  const refetch = useCallback(() => {
    refetchQuery();
  }, [refetchQuery]);

  return {
    items: query.data?.items ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isRemoving: removeMutation.isPending,
    error:
      mutationError ?? (query.error ? errorMessage(query.error, "Failed to load Watchlist") : null),
    remove,
    refetch,
  };
}
