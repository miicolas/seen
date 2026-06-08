import { notInterestedKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useAuthContext } from "@/hooks/use-auth-context";
import type { MediaType } from "@/lib/tmdb";
import { listMyItems, type NotInterestedItem } from "@/services/not-interested";

interface NotInterestedListState {
  items: NotInterestedItem[];
  isDismissed: (tmdbId: number, mediaType: MediaType) => boolean;
  isLoading: boolean;
}

export function useNotInterestedList(): NotInterestedListState {
  const { user } = useAuthContext();
  const canLoad = !!user;

  const query = useQuery({
    queryKey: notInterestedKeys.list(),
    queryFn: listMyItems,
    enabled: canLoad,
  });

  const dismissedSet = useMemo(() => {
    const set = new Set<string>();
    for (const item of query.data ?? []) {
      set.add(`${item.tmdb_id}:${item.media_type}`);
    }
    return set;
  }, [query.data]);

  const isDismissed = useCallback(
    (tmdbId: number, mediaType: MediaType) => dismissedSet.has(`${tmdbId}:${mediaType}`),
    [dismissedSet],
  );

  return {
    items: query.data ?? [],
    isDismissed,
    isLoading: query.isLoading,
  };
}
