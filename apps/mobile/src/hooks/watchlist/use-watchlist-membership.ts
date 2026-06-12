import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useInvalidateAnalytics } from "@/hooks/analytics/use-invalidate-analytics";
import { useLibraryMemberships } from "@/hooks/library/use-library-memberships";
import { useMembershipsCache } from "@/hooks/library/use-memberships-cache";
import type { MediaType } from "@/lib/tmdb";
import { track } from "@/services/events";
import { hasMembership } from "@/services/library";
import { addToWatchlist, removeFromWatchlist } from "@/services/watchlist";

interface WatchlistMembershipState {
  isInWatchlist: boolean;
  isSaving: boolean;
  toggle: () => Promise<void>;
}

export function useWatchlistMembership(
  tmdbId: number,
  mediaType: MediaType,
): WatchlistMembershipState {
  const queryClient = useQueryClient();
  const { memberships } = useLibraryMemberships();
  const cache = useMembershipsCache();
  const invalidateAnalytics = useInvalidateAnalytics();
  const isInWatchlist = hasMembership(memberships, "watchlist", tmdbId, mediaType);

  const invalidateLists = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["watchlist", "list"] });
    invalidateAnalytics();
  }, [queryClient, invalidateAnalytics]);

  const addMutation = useMutation({
    mutationFn: () => addToWatchlist({ tmdb_id: tmdbId, media_type: mediaType }),
    onMutate: async () => {
      const previous = await cache.begin();
      cache.add("watchlist", { tmdb_id: tmdbId, media_type: mediaType });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      cache.restore(context?.previous);
    },
    onSuccess: () => {
      invalidateLists();
      track("added_watchlist", { tmdbId, mediaType });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeFromWatchlist({ tmdbId, mediaType }),
    onMutate: async () => {
      const previous = await cache.begin();
      cache.remove("watchlist", { tmdb_id: tmdbId, media_type: mediaType });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      cache.restore(context?.previous);
    },
    onSuccess: () => {
      invalidateLists();
      track("removed_watchlist", { tmdbId, mediaType });
    },
  });

  const toggle = useCallback(async () => {
    if (isInWatchlist) await removeMutation.mutateAsync();
    else await addMutation.mutateAsync();
  }, [addMutation, isInWatchlist, removeMutation]);

  return {
    isInWatchlist,
    isSaving: addMutation.isPending || removeMutation.isPending,
    toggle,
  };
}
