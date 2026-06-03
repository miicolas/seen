import { useCallback, useEffect, useState } from "react";

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
}

export function useMyReview(
  tmdbId: number,
  mediaType: MediaType,
): MyReviewState {
  const { user } = useAuthContext();
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setReview(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getMyReview(tmdbId, mediaType)
      .then((data) => {
        if (!cancelled) setReview(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Failed to load your review"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tmdbId, mediaType, user]);

  const save = useCallback(
    async (input: Omit<ReviewInput, "tmdb_id" | "media_type">) => {
      setIsSaving(true);
      setError(null);
      try {
        const saved = await upsertReview({ tmdb_id: tmdbId, media_type: mediaType, ...input });
        setReview(saved);
      } catch (err) {
        setError(errorMessage(err, "Failed to save your review"));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [tmdbId, mediaType],
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
  }, [tmdbId, mediaType]);

  return { review, isLoading, isSaving, error, save, remove };
}
