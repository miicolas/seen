import { profileKeys, reviewKeys, watchlistKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useInvalidateAnalytics } from "@/hooks/analytics/use-invalidate-analytics";
import { useAuthContext } from "@/hooks/use-auth-context";
import { track } from "@/services/events";
import { errorMessage } from "@/lib/format";
import {
  deleteReview,
  getMyReview,
  upsertReview,
  type Review,
  type ReviewInput,
} from "@/services/reviews";
import type { MediaType } from "@/lib/tmdb";

interface MyReviewState {
  review: Review | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  save: (input: Omit<ReviewInput, "tmdb_id" | "media_type">) => Promise<void>;
  remove: () => Promise<void>;
  refetch: () => void;
}

export function useMyReview(tmdbId: number, mediaType: MediaType): MyReviewState {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const canLoad = !!user && Number.isFinite(tmdbId) && tmdbId > 0;
  const key = reviewKeys.my(mediaType, tmdbId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => getMyReview({ tmdbId, mediaType }),
    enabled: canLoad,
  });

  const invalidateAnalytics = useInvalidateAnalytics();

  const invalidateDerived = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: reviewKeys.list(mediaType, tmdbId),
    });
    queryClient.invalidateQueries({
      queryKey: reviewKeys.stats(mediaType, tmdbId),
    });
    queryClient.setQueryData(watchlistKeys.my(mediaType, tmdbId), null);
    queryClient.invalidateQueries({ queryKey: ["watchlist", "list"] });
    queryClient.invalidateQueries({ queryKey: profileKeys.activity() });
    invalidateAnalytics();
  }, [mediaType, queryClient, tmdbId, invalidateAnalytics]);

  const saveMutation = useMutation({
    mutationFn: (input: Omit<ReviewInput, "tmdb_id" | "media_type">) =>
      upsertReview({
        tmdb_id: tmdbId,
        media_type: mediaType,
        ...input,
      }),
    onSuccess: (saved, input) => {
      queryClient.setQueryData(key, saved);
      invalidateDerived();
      if (input.rating != null) track("rated", { tmdbId, mediaType });
      if (input.title || input.comment) track("reviewed", { tmdbId, mediaType });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteReview({ tmdbId, mediaType }),
    onSuccess: () => {
      queryClient.setQueryData(key, null);
      invalidateDerived();
    },
  });

  const save = useCallback(
    async (input: Omit<ReviewInput, "tmdb_id" | "media_type">) => {
      setMutationError(null);
      try {
        await saveMutation.mutateAsync(input);
      } catch (err) {
        setMutationError(errorMessage(err, "Failed to save your review"));
        throw err;
      }
    },
    [saveMutation],
  );

  const remove = useCallback(async () => {
    setMutationError(null);
    try {
      await deleteMutation.mutateAsync();
    } catch (err) {
      setMutationError(errorMessage(err, "Failed to delete your review"));
      throw err;
    }
  }, [deleteMutation]);

  return {
    review: query.data ?? null,
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending || deleteMutation.isPending,
    error:
      mutationError ??
      (query.error ? errorMessage(query.error, "Failed to load your review") : null),
    save,
    remove,
    refetch: () => {
      query.refetch();
    },
  };
}
