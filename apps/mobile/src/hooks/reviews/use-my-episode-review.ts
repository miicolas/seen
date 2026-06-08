import { episodeReviewKeys, profileKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useInvalidateAnalytics } from "@/hooks/analytics/use-invalidate-analytics";
import { useAuthContext } from "@/hooks/use-auth-context";
import { errorMessage } from "@/lib/format";
import {
  deleteEpisodeReview,
  getMyEpisodeReview,
  upsertEpisodeReview,
  type EpisodeReview,
  type EpisodeReviewInput,
} from "@/services/episode-reviews";

type SaveEpisodeReviewInput = Pick<
  EpisodeReviewInput,
  "rating" | "title" | "comment" | "watched_at"
>;

interface MyEpisodeReviewState {
  review: EpisodeReview | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  save: (input: SaveEpisodeReviewInput) => Promise<void>;
  remove: () => Promise<void>;
  refetch: () => void;
}

export function useMyEpisodeReview(params: {
  seriesTmdbId: number;
  episodeTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}): MyEpisodeReviewState {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const canLoad = !!user && canLoadEpisodeReview(params);
  const key = episodeReviewKeys.my(params.seriesTmdbId, params.seasonNumber, params.episodeNumber);
  const query = useQuery({
    queryKey: key,
    queryFn: () => getMyEpisodeReview(params),
    enabled: canLoad,
  });

  const invalidateAnalytics = useInvalidateAnalytics();

  const invalidateDerived = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: episodeReviewKeys.list(
        params.seriesTmdbId,
        params.seasonNumber,
        params.episodeNumber,
      ),
    });
    queryClient.invalidateQueries({
      queryKey: episodeReviewKeys.stats(
        params.seriesTmdbId,
        params.seasonNumber,
        params.episodeNumber,
      ),
    });
    queryClient.invalidateQueries({
      queryKey: episodeReviewKeys.seasonStats(params.seriesTmdbId, params.seasonNumber),
    });
    queryClient.invalidateQueries({
      queryKey: episodeReviewKeys.seasonRatings(params.seriesTmdbId, params.seasonNumber),
    });
    queryClient.invalidateQueries({ queryKey: profileKeys.activity() });
    invalidateAnalytics();
  }, [params, queryClient, invalidateAnalytics]);

  const saveMutation = useMutation({
    mutationFn: (input: SaveEpisodeReviewInput) =>
      upsertEpisodeReview({
        series_tmdb_id: params.seriesTmdbId,
        episode_tmdb_id: params.episodeTmdbId,
        season_number: params.seasonNumber,
        episode_number: params.episodeNumber,
        ...input,
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(key, saved);
      invalidateDerived();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEpisodeReview(params),
    onSuccess: () => {
      queryClient.setQueryData(key, null);
      invalidateDerived();
    },
  });

  const save = useCallback(
    async (input: SaveEpisodeReviewInput) => {
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

function canLoadEpisodeReview(params: {
  seriesTmdbId: number;
  episodeTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}): boolean {
  return (
    Number.isFinite(params.seriesTmdbId) &&
    params.seriesTmdbId > 0 &&
    Number.isFinite(params.episodeTmdbId) &&
    params.episodeTmdbId > 0 &&
    Number.isInteger(params.seasonNumber) &&
    params.seasonNumber >= 0 &&
    Number.isInteger(params.episodeNumber) &&
    params.episodeNumber > 0
  );
}
