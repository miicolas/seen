import { useCallback, useState } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useAuthContext } from "@/hooks/use-auth-context";
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

export function useMyReview(
  tmdbId: number,
  mediaType: MediaType,
): MyReviewState {
  const { user } = useAuthContext();
  const {
    data: review,
    setData: setReview,
    isLoading,
    error,
    setError,
    refetch,
  } = useAsyncResource<Review | null>(
    () => (user ? getMyReview(tmdbId, mediaType) : Promise.resolve(null)),
    [tmdbId, mediaType, user],
    null,
    "Failed to load your review",
  );

  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(
    async (input: Omit<ReviewInput, "tmdb_id" | "media_type">) => {
      setIsSaving(true);
      setError(null);
      try {
        const saved = await upsertReview({
          tmdb_id: tmdbId,
          media_type: mediaType,
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
    [tmdbId, mediaType, setReview, setError],
  );

  const remove = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      await deleteReview(tmdbId, mediaType);
      setReview(null);
    } catch (err) {
      setError(errorMessage(err, "Failed to delete your review"));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [tmdbId, mediaType, setReview, setError]);

  return { review, isLoading, isSaving, error, save, remove, refetch };
}
