import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAccentColor } from "@/hooks/use-accent-color";
import { useMyEpisodeReview } from "@/hooks/reviews/use-my-episode-review";
import { useTvEpisodeDetail } from "@/hooks/tmdb/use-tv-episode-detail";
import { hapticTap } from "@/lib/haptics";
import { episodeReviewSheetHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb";
import { ratingToStars } from "@/services/core";

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
  const { episode, isLoading, error } = useTvEpisodeDetail(
    seriesId,
    seasonNumber,
    episodeNumber,
  );

  const episodeTmdbIdParam = Number(params.episodeTmdbId);
  const episodeTmdbId =
    Number.isFinite(episodeTmdbIdParam) && episodeTmdbIdParam > 0
      ? episodeTmdbIdParam
      : episode?.id ?? 0;
  const { review, refetch: refetchEpisodeReview } = useMyEpisodeReview({
    seriesTmdbId: seriesId,
    episodeTmdbId,
    seasonNumber,
    episodeNumber,
  });

  const title =
    episode?.name?.trim() ||
    params.episodeTitle?.trim() ||
    t("episode.fallbackTitle", { number: episodeNumber || "" }).trim();
  const seriesTitle = params.seriesTitle?.trim() || t("episode.series");
  const backdropUri = tmdbImageUrl(
    episode?.still_path ?? params.still_path ?? null,
    "w1280",
  );
  const posterUri = tmdbImageUrl(params.poster_path ?? null, "w500");
  const year = (episode?.air_date ?? "").slice(0, 4) || undefined;
  const runtime = episode?.runtime ? `${episode.runtime} min` : undefined;
  const episodeMeta =
    Number.isInteger(seasonNumber) && Number.isInteger(episodeNumber)
      ? `S${seasonNumber} E${episodeNumber}`
      : undefined;
  const myStars = review?.rating != null ? ratingToStars(review.rating) : 0;
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
    [
      episode?.air_date,
      crew,
      episodeNumber,
      runtime,
      seasonNumber,
      seriesTitle,
      t,
    ],
  );

  const handleClose = useCallback(() => {
    hapticTap();
    router.back();
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      refetchEpisodeReview();
    }, [refetchEpisodeReview]),
  );

  return {
    accentHex,
    title,
    seriesTitle,
    backdropUri,
    posterUri,
    year,
    runtime,
    episodeMeta,
    myStars,
    hasReview,
    cast,
    infoRows,
    overview: episode?.overview,
    episodeTmdbId,
    isLoading,
    error,
    hasEpisode: episode != null,
    handleClose,
    handleRate,
  };
}
