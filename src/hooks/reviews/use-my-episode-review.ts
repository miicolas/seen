import { useCallback, useState } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
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
  "rating" | "title" | "comment"
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
  const {
    data: review,
    setData: setReview,
    isLoading,
    error,
    setError,
    refetch,
  } = useAsyncResource<EpisodeReview | null>(
    () =>
      user && canLoadEpisodeReview(params)
        ? getMyEpisodeReview(params)
        : Promise.resolve(null),
    [
      params.seriesTmdbId,
      params.episodeTmdbId,
      params.seasonNumber,
      params.episodeNumber,
      user?.id,
    ],
    null,
    "Failed to load your review",
  );

  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(
    async (input: SaveEpisodeReviewInput) => {
      setIsSaving(true);
      setError(null);
      try {
        const saved = await upsertEpisodeReview({
          series_tmdb_id: params.seriesTmdbId,
          episode_tmdb_id: params.episodeTmdbId,
          season_number: params.seasonNumber,
          episode_number: params.episodeNumber,
          ...input,
        });
        setReview(saved);
      } catch (err) {
        setError(errorMessage(err, "Failed to save your review"));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [params, setError, setReview],
  );

  const remove = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      await deleteEpisodeReview(params);
      setReview(null);
    } catch (err) {
      setError(errorMessage(err, "Failed to delete your review"));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [params, setError, setReview]);

  return { review, isLoading, isSaving, error, save, remove, refetch };
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
