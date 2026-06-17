import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAccentColor } from "@/hooks/use-accent-color";
import { useEpisodeReviewPreview } from "@/hooks/reviews/use-episode-reviews";
import { useEpisodeStats } from "@/hooks/reviews/use-episode-stats";
import { useMyEpisodeReview } from "@/hooks/reviews/use-my-episode-review";
import { useTvEpisodeDetail } from "@/hooks/tmdb/use-tv-episode-detail";
import { hapticTap } from "@/lib/haptics";
import { episodeReviewSheetHref, episodeReviewsListHref } from "@/lib/navigation";
import { releaseYear } from "@/lib/format";
import { tmdbImageUrl } from "@/lib/tmdb";
import { ratingToStars } from "@/services/core";
import type { MediaReviewStats } from "@/services/reviews";

import { buildEpisodeInfoRows } from "./build-episode-info-rows";
import type { CastMember, CrewMember } from "../media-detail/types";

export function useEpisodeDetailViewModel() {
  const { t } = useTranslation();
  const { accentHex } = useAccentColor();
  const params = useLocalSearchParams<{
    seriesId: string;
    episodeTmdbId?: string;
    seasonNumber: string;
    episodeNumber: string;
    seriesTitle?: string;
    episodeTitle?: string;
    poster_path?: string;
    still_path?: string;
  }>();

  const seriesId = Number(params.seriesId);
  const seasonNumber = Number(params.seasonNumber);
  const episodeNumber = Number(params.episodeNumber);
  const { episode, isLoading, error } = useTvEpisodeDetail(seriesId, seasonNumber, episodeNumber);

  const episodeTmdbIdParam = Number(params.episodeTmdbId);
  const episodeTmdbId =
    Number.isFinite(episodeTmdbIdParam) && episodeTmdbIdParam > 0
      ? episodeTmdbIdParam
      : (episode?.id ?? 0);
  const { review, refetch: refetchEpisodeReview } = useMyEpisodeReview({
    seriesTmdbId: seriesId,
    episodeTmdbId,
    seasonNumber,
    episodeNumber,
  });

  const { stats: episodeStats, refetch: refetchStats } = useEpisodeStats(
    seriesId,
    seasonNumber,
    episodeNumber,
  );
  const {
    reviews: previewReviews,
    count: reviewCount,
    refetch: refetchPreview,
  } = useEpisodeReviewPreview({
    seriesTmdbId: seriesId,
    seasonNumber,
    episodeNumber,
  });

  const stats: MediaReviewStats | null = episodeStats
    ? {
        tmdb_id: episodeTmdbId,
        media_type: "tv",
        rating_count: episodeStats.rating_count,
        avg_rating: episodeStats.avg_rating,
        review_count: reviewCount,
        histogram: episodeStats.histogram,
      }
    : null;

  const title =
    episode?.name?.trim() ||
    params.episodeTitle?.trim() ||
    t("episode.fallbackTitle", { number: episodeNumber || "" }).trim();
  const seriesTitle = params.seriesTitle?.trim() || t("episode.series");
  const backdropUri = tmdbImageUrl(episode?.still_path ?? params.still_path ?? null, "w1280");
  const posterUri = tmdbImageUrl(params.poster_path ?? null, "w500");
  const year = releaseYear(episode?.air_date);
  const runtime = episode?.runtime ? `${episode.runtime} min` : undefined;
  const episodeMeta =
    Number.isInteger(seasonNumber) && Number.isInteger(episodeNumber)
      ? `S${seasonNumber} E${episodeNumber}`
      : undefined;
  const myStars = review?.rating != null ? ratingToStars(review.rating) : 0;
  const hasRating = myStars > 0;
  const hasReview = review != null;

  const crew = useMemo(
    () =>
      ((episode?.credits?.crew ?? episode?.crew ?? []) as CrewMember[]).filter(
        (member) => member.name,
      ),
    [episode],
  );
  const cast = useMemo(
    () =>
      (episode?.credits?.guest_stars ??
        episode?.guest_stars ??
        episode?.credits?.cast ??
        []) as CastMember[],
    [episode],
  );
  const infoRows = useMemo(
    () =>
      buildEpisodeInfoRows(
        {
          episodeNumber,
          seasonNumber,
          seriesTitle,
          airDate: episode?.air_date,
          runtime,
          crew,
        },
        t,
      ),
    [episode?.air_date, crew, episodeNumber, runtime, seasonNumber, seriesTitle, t],
  );

  const handleRate = useCallback(() => {
    if (episodeTmdbId <= 0) return;
    hapticTap();
    router.push(
      episodeReviewSheetHref({
        seriesId,
        episodeTmdbId,
        seasonNumber,
        episodeNumber,
        title,
        rating: myStars || undefined,
        poster_path: episode?.still_path ?? params.still_path ?? null,
        mediaSubtitle: episodeMeta,
      }),
    );
  }, [
    episode?.still_path,
    episodeMeta,
    episodeTmdbId,
    episodeNumber,
    myStars,
    params.still_path,
    seasonNumber,
    seriesId,
    title,
  ]);

  const openReviews = useCallback(() => {
    hapticTap();
    router.push(episodeReviewsListHref({ seriesId, seasonNumber, episodeNumber, title }));
  }, [seriesId, seasonNumber, episodeNumber, title]);

  useFocusEffect(
    useCallback(() => {
      refetchEpisodeReview();
      refetchStats();
      refetchPreview();
    }, [refetchEpisodeReview, refetchStats, refetchPreview]),
  );

  return {
    accentHex,
    title,
    seriesTitle,
    backdropUri,
    posterUri,
    year,
    runtime,
    runtimeMinutes: episode?.runtime ?? null,
    seriesId,
    seasonNumber,
    episodeNumber,
    episodeMeta,
    myStars,
    hasRating,
    hasReview,
    cast,
    infoRows,
    overview: episode?.overview,
    episodeTmdbId,
    stats,
    reviews: previewReviews,
    reviewCount,
    openReviews,
    isLoading,
    error,
    hasEpisode: episode != null,
    handleRate,
  };
}
