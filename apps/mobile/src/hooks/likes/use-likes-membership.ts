import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useInvalidateAnalytics } from "@/hooks/analytics/use-invalidate-analytics";
import { useLibraryMemberships } from "@/hooks/library/use-library-memberships";
import { useMembershipsCache } from "@/hooks/library/use-memberships-cache";
import type { MediaType } from "@/lib/tmdb";
import { track } from "@/services/events";
import { hasMembership, type MembershipSet } from "@/services/library";
import { addLike, removeLike, type LikeKind } from "@/services/likes";

interface LikesMembershipState {
  isLiked: boolean;
  isFavorited: boolean;
  isLikeSaving: boolean;
  isFavoriteSaving: boolean;
  toggleLike: () => Promise<void>;
  toggleFavorite: () => Promise<void>;
}

function setFor(kind: LikeKind): MembershipSet {
  return kind === "like" ? "likes" : "favorites";
}

export function useLikesMembership(tmdbId: number, mediaType: MediaType): LikesMembershipState {
  const queryClient = useQueryClient();
  const { memberships } = useLibraryMemberships();
  const cache = useMembershipsCache();
  const invalidateAnalytics = useInvalidateAnalytics();
  const isLiked = hasMembership(memberships, "likes", tmdbId, mediaType);
  const isFavorited = hasMembership(memberships, "favorites", tmdbId, mediaType);

  const invalidateLists = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["likes", "list"] });
    invalidateAnalytics();
  }, [queryClient, invalidateAnalytics]);

  const addMutation = useMutation({
    mutationFn: (kind: LikeKind) => addLike({ tmdb_id: tmdbId, media_type: mediaType, kind }),
    onMutate: async (kind) => {
      const previous = await cache.begin();
      cache.add(setFor(kind), { tmdb_id: tmdbId, media_type: mediaType });
      return { previous };
    },
    onError: (_error, _kind, context) => {
      cache.restore(context?.previous);
    },
    onSuccess: (_saved, kind) => {
      invalidateLists();
      track("liked", { tmdbId, mediaType, metadata: { kind } });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (kind: LikeKind) => removeLike({ tmdbId, mediaType, kind }),
    onMutate: async (kind) => {
      const previous = await cache.begin();
      cache.remove(setFor(kind), { tmdb_id: tmdbId, media_type: mediaType });
      return { previous };
    },
    onError: (_error, _kind, context) => {
      cache.restore(context?.previous);
    },
    onSuccess: () => {
      invalidateLists();
    },
  });

  const toggle = useCallback(
    async (kind: LikeKind, isSet: boolean) => {
      if (isSet) await removeMutation.mutateAsync(kind);
      else await addMutation.mutateAsync(kind);
    },
    [addMutation, removeMutation],
  );

  const toggleLike = useCallback(() => toggle("like", isLiked), [isLiked, toggle]);
  const toggleFavorite = useCallback(() => toggle("favorite", isFavorited), [isFavorited, toggle]);

  const savingKind = addMutation.variables ?? removeMutation.variables;
  const isSaving = addMutation.isPending || removeMutation.isPending;

  return {
    isLiked,
    isFavorited,
    isLikeSaving: isSaving && savingKind === "like",
    isFavoriteSaving: isSaving && savingKind === "favorite",
    toggleLike,
    toggleFavorite,
  };
}
