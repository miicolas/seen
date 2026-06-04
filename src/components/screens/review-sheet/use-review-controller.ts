import { useTranslation } from "react-i18next";

import { useAuthContext } from "@/hooks/use-auth-context";
import { useMyEpisodeReview } from "@/hooks/reviews/use-my-episode-review";
import { useMyReview } from "@/hooks/reviews/use-my-review";
import { tmdbImageUrl, type MediaType } from "@/lib/tmdb";
import { ratingToStars } from "@/services/core";

export type ReviewSheetParams = {
  id?: string;
  mediaType?: MediaType;
  title?: string;
  rating?: string;
  poster_path?: string;
  mediaSubtitle?: string;
  reviewType?: "episode";
  seriesId?: string;
  episodeTmdbId?: string;
  seasonNumber?: string;
  episodeNumber?: string;
};

type SaveReviewInput = {
  rating: number | null;
  title: string | null;
  comment: string | null;
};

export interface ReviewController {
  mediaTitle: string;
  mediaSubtitle?: string;
  posterUri?: string;
  initialStars: number;
  initialTitle: string;
  initialComment: string;
  nickname: string | null;
  hasReview: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  formTitle?: string;
  save: (input: SaveReviewInput) => Promise<void>;
  remove: () => Promise<void>;
}

// A movie/series review and an episode review differ only in which data hook
// backs them. Both hooks run every render (stable hook order) — the inactive one
// is fed inert ids and short-circuits to a null review / no-op save.
export function useReviewController(params: ReviewSheetParams): ReviewController {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const isEpisode = params.reviewType === "episode";

  const presetRating = params.rating ? Number(params.rating) : 0;
  const initialPresetRating = Number.isFinite(presetRating) ? presetRating : 0;
  const posterUri = tmdbImageUrl(params.poster_path, "w154");

  const mediaType: MediaType = params.mediaType === "tv" ? "tv" : "movie";
  const media = useMyReview(isEpisode ? NaN : Number(params.id), mediaType);

  const seasonNumber = Number(params.seasonNumber);
  const episodeNumber = Number(params.episodeNumber);
  const episode = useMyEpisodeReview({
    seriesTmdbId: Number(params.seriesId),
    episodeTmdbId: Number(params.episodeTmdbId),
    seasonNumber,
    episodeNumber,
  });

  const active = isEpisode ? episode : media;
  const review = active.review;
  const initialStars =
    review?.rating != null ? ratingToStars(review.rating) : initialPresetRating;

  const mediaSubtitle = isEpisode
    ? params.mediaSubtitle ??
      (Number.isInteger(seasonNumber) && Number.isInteger(episodeNumber)
        ? `S${seasonNumber} E${episodeNumber}`
        : undefined)
    : params.mediaSubtitle;

  return {
    mediaTitle: params.title ?? (isEpisode ? "Episode" : "Untitled"),
    mediaSubtitle,
    posterUri,
    initialStars,
    initialTitle: review?.title ?? "",
    initialComment: review?.comment ?? "",
    nickname: isEpisode ? null : userNickname(user),
    hasReview: review != null,
    isLoading: active.isLoading,
    isSaving: active.isSaving,
    error: active.error,
    formTitle: isEpisode ? t("review.rateEpisode") : undefined,
    save: active.save,
    remove: active.remove,
  };
}

function userNickname(user: ReturnType<typeof useAuthContext>["user"]) {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const metadataName =
    stringValue(metadata?.full_name) ??
    stringValue(metadata?.display_name) ??
    stringValue(metadata?.name) ??
    stringValue(metadata?.user_name);

  if (metadataName) return metadataName;

  const emailName = user?.email?.split("@")[0]?.trim();
  return emailName || null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}
