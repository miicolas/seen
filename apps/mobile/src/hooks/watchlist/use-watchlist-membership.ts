import { watchlistKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useInvalidateAnalytics } from "@/hooks/analytics/use-invalidate-analytics";
import { useAuthContext } from "@/hooks/use-auth-context";
import { errorMessage } from "@/lib/format";
import type { MediaType } from "@/lib/tmdb";
import { track } from "@/services/events";
import {
  addToWatchlist,
  getMyWatchlistItem,
  removeFromWatchlist,
  type WatchlistItem,
} from "@/services/watchlist";

interface WatchlistMembershipState {
  item: WatchlistItem | null;
  isInWatchlist: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  add: () => Promise<void>;
  remove: () => Promise<void>;
  toggle: () => Promise<void>;
  refetch: () => void;
}

export function useWatchlistMembership(
  tmdbId: number,
  mediaType: MediaType,
): WatchlistMembershipState {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const canLoad = !!user && Number.isFinite(tmdbId) && tmdbId > 0;
  const key = watchlistKeys.my(mediaType, tmdbId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getMyWatchlistItem({ tmdbId, mediaType }),
    enabled: canLoad,
  });
  const refetchQuery = query.refetch;
  const invalidateAnalytics = useInvalidateAnalytics();

  const invalidateLists = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["watchlist", "list"] });
    invalidateAnalytics();
  }, [queryClient, invalidateAnalytics]);

  const addMutation = useMutation({
    mutationFn: () => addToWatchlist({ tmdb_id: tmdbId, media_type: mediaType }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WatchlistItem | null>(key);
      queryClient.setQueryData<WatchlistItem>(key, {
        id: "optimistic",
        user_id: user?.id ?? "",
        tmdb_id: tmdbId,
        media_type: mediaType,
        added_at: new Date().toISOString(),
        visibility: "private",
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous ?? null);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(key, saved);
      invalidateLists();
      track("added_watchlist", { tmdbId, mediaType });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeFromWatchlist({ tmdbId, mediaType }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WatchlistItem | null>(key);
      queryClient.setQueryData(key, null);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous ?? null);
    },
    onSuccess: () => {
      invalidateLists();
      track("removed_watchlist", { tmdbId, mediaType });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const add = useCallback(async () => {
    setMutationError(null);
    try {
      await addMutation.mutateAsync();
    } catch (err) {
      setMutationError(errorMessage(err, "Failed to add to Watchlist"));
      throw err;
    }
  }, [addMutation]);

  const remove = useCallback(async () => {
    setMutationError(null);
    try {
      await removeMutation.mutateAsync();
    } catch (err) {
      setMutationError(errorMessage(err, "Failed to remove from Watchlist"));
      throw err;
    }
  }, [removeMutation]);

  const toggle = useCallback(async () => {
    if (query.data) await remove();
    else await add();
  }, [add, query.data, remove]);

  const refetch = useCallback(() => {
    refetchQuery();
  }, [refetchQuery]);

  return {
    item: query.data ?? null,
    isInWatchlist: !!query.data,
    isLoading: query.isLoading,
    isSaving: addMutation.isPending || removeMutation.isPending,
    error:
      mutationError ??
      (query.error ? errorMessage(query.error, "Failed to load Watchlist state") : null),
    add,
    remove,
    toggle,
    refetch,
  };
}
