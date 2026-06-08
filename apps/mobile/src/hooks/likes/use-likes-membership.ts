import { likeKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useInvalidateAnalytics } from "@/hooks/analytics/use-invalidate-analytics";
import { useAuthContext } from "@/hooks/use-auth-context";
import { errorMessage } from "@/lib/format";
import type { MediaType } from "@/lib/tmdb";
import { track } from "@/services/events";
import {
  addLike,
  getMyLikes,
  removeLike,
  type LikeItem,
  type LikeKind,
  type LikeMembership,
} from "@/services/likes";

interface LikesMembershipState {
  isLiked: boolean;
  isFavorited: boolean;
  isLikeSaving: boolean;
  isFavoriteSaving: boolean;
  toggleLike: () => Promise<void>;
  toggleFavorite: () => Promise<void>;
  error: string | null;
  refetch: () => void;
}

const EMPTY: LikeMembership = { like: null, favorite: null };

export function useLikesMembership(tmdbId: number, mediaType: MediaType): LikesMembershipState {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const canLoad = !!user && Number.isFinite(tmdbId) && tmdbId > 0;
  const key = likeKeys.my(mediaType, tmdbId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getMyLikes({ tmdbId, mediaType }),
    enabled: canLoad,
  });
  const refetchQuery = query.refetch;
  const invalidateAnalytics = useInvalidateAnalytics();

  const invalidateLists = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["likes", "list"] });
    invalidateAnalytics();
  }, [queryClient, invalidateAnalytics]);

  const addMutation = useMutation({
    mutationFn: (kind: LikeKind) => addLike({ tmdb_id: tmdbId, media_type: mediaType, kind }),
    onMutate: async (kind) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<LikeMembership>(key) ?? EMPTY;
      const optimistic: LikeItem = {
        id: "optimistic",
        user_id: user?.id ?? "",
        tmdb_id: tmdbId,
        media_type: mediaType,
        kind,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<LikeMembership>(key, { ...previous, [kind]: optimistic });
      return { previous };
    },
    onError: (_error, _kind, context) => {
      queryClient.setQueryData(key, context?.previous ?? EMPTY);
    },
    onSuccess: (saved, kind) => {
      queryClient.setQueryData<LikeMembership>(key, (current) => ({
        ...(current ?? EMPTY),
        [kind]: saved,
      }));
      invalidateLists();
      track("liked", { tmdbId, mediaType, metadata: { kind } });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (kind: LikeKind) => removeLike({ tmdbId, mediaType, kind }),
    onMutate: async (kind) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<LikeMembership>(key) ?? EMPTY;
      queryClient.setQueryData<LikeMembership>(key, { ...previous, [kind]: null });
      return { previous };
    },
    onError: (_error, _kind, context) => {
      queryClient.setQueryData(key, context?.previous ?? EMPTY);
    },
    onSuccess: () => {
      invalidateLists();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const toggle = useCallback(
    async (kind: LikeKind) => {
      setMutationError(null);
      const isSet = !!query.data?.[kind];
      try {
        if (isSet) await removeMutation.mutateAsync(kind);
        else await addMutation.mutateAsync(kind);
      } catch (err) {
        setMutationError(errorMessage(err, "Failed to update like"));
        throw err;
      }
    },
    [addMutation, removeMutation, query.data],
  );

  const toggleLike = useCallback(() => toggle("like"), [toggle]);
  const toggleFavorite = useCallback(() => toggle("favorite"), [toggle]);

  const refetch = useCallback(() => {
    refetchQuery();
  }, [refetchQuery]);

  const savingKind = addMutation.variables ?? removeMutation.variables;
  const isSaving = addMutation.isPending || removeMutation.isPending;

  return {
    isLiked: !!query.data?.like,
    isFavorited: !!query.data?.favorite,
    isLikeSaving: isSaving && savingKind === "like",
    isFavoriteSaving: isSaving && savingKind === "favorite",
    toggleLike,
    toggleFavorite,
    error:
      mutationError ??
      (query.error ? errorMessage(query.error, "Failed to load like state") : null),
    refetch,
  };
}
