import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Share, useWindowDimensions } from "react-native";

import { useAccentColor } from "@/hooks/use-accent-color";
import { useMediaDetail } from "@/hooks/use-media-detail";
import { useMovieReviews } from "@/hooks/use-movie-reviews";
import { useMyReview } from "@/hooks/use-my-review";
import { hapticTap } from "@/lib/haptics";
import { reviewSheetHref } from "@/lib/navigation";
import { tmdbImageUrl, type MediaType } from "@/lib/tmdb";
import {
  getMovieStats,
  ratingToStars,
  type MovieReviewStats,
} from "@/services/reviews";

import { formatDate } from "./utils";
import type { CastMember, CrewMember, InfoRowData } from "./types";

export function useMediaDetailViewModel() {
  const params = useLocalSearchParams<{
    id: string;
    mediaType?: MediaType;
    title?: string;
    poster_path?: string;
    backdrop_path?: string;
  }>();

  const tmdbId = Number(params.id);
  const mediaType: MediaType = params.mediaType === "tv" ? "tv" : "movie";

  const router = useRouter();
  const { accentHex } = useAccentColor();
  const { width } = useWindowDimensions();

  const { detail, isLoading, error } = useMediaDetail(tmdbId, mediaType);
  const { review, refetch } = useMyReview(tmdbId, mediaType);
  const { reviews } = useMovieReviews(tmdbId, mediaType);
  const [stats, setStats] = useState<MovieReviewStats | null>(null);

  const loadStats = useCallback(() => {
    getMovieStats(tmdbId, mediaType)
      .then(setStats)
      .catch(() => setStats(null));
  }, [tmdbId, mediaType]);

  useEffect(() => loadStats(), [loadStats]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      loadStats();
    }, [refetch, loadStats]),
  );

  const title = detail?.title ?? params.title ?? "Untitled";
  const backdropUri = tmdbImageUrl(
    detail?.backdrop_path ?? params.backdrop_path ?? null,
    "w1280",
  );
  const posterUri = tmdbImageUrl(
    detail?.poster_path ??
      params.poster_path ??
      detail?.backdrop_path ??
      params.backdrop_path ??
      null,
    "w500",
  );

  const year = (detail?.release_date ?? "").slice(0, 4) || undefined;
  const episodeRuntime = (detail?.episode_run_time as number[] | undefined)?.[0];
  const runtime = detail?.runtime
    ? `${detail.runtime} min`
    : episodeRuntime
      ? `${episodeRuntime} min`
      : undefined;
  const genres = detail?.genres?.map((g) => g.name).join(", ") || undefined;
  const seasons =
    typeof detail?.number_of_seasons === "number"
      ? `${detail.number_of_seasons}`
      : undefined;
  const tagline =
    typeof detail?.tagline === "string" && detail.tagline.length > 0
      ? detail.tagline
      : undefined;
  const status = typeof detail?.status === "string" ? detail.status : undefined;

  const credits = detail?.credits as
    | { cast?: CastMember[]; crew?: CrewMember[] }
    | undefined;
  const cast = (credits?.cast ?? []).slice(0, 16);
  const createdBy = (detail?.created_by as { name?: string }[] | undefined)
    ?.map((c) => c.name)
    .filter(Boolean)
    .join(", ");
  const director =
    mediaType === "tv"
      ? createdBy || undefined
      : credits?.crew?.find((c) => c.job === "Director")?.name;
  const studio = (
    detail?.production_companies as { name?: string }[] | undefined
  )?.[0]?.name;
  const originalLanguage =
    typeof detail?.original_language === "string"
      ? detail.original_language.toUpperCase()
      : undefined;

  const myStars = review?.rating != null ? ratingToStars(review.rating) : 0;
  const hasReview = review != null;

  // 10 half-star buckets: index 0 = 0.5★ … index 9 = 5★ (DB rating is 1..10).
  const histogram = useMemo(() => {
    const buckets = new Array(10).fill(0) as number[];
    for (const r of reviews) {
      if (r.rating == null) continue;
      const index = Math.min(9, Math.max(0, Math.round(r.rating) - 1));
      buckets[index] += 1;
    }
    return buckets;
  }, [reviews]);

  const infoRows: InfoRowData[] = [
    director
      ? { label: mediaType === "tv" ? "Creator" : "Director", value: director }
      : null,
    seasons ? { label: "Seasons", value: seasons } : null,
    detail?.release_date
      ? { label: "Release date", value: formatDate(detail.release_date)! }
      : null,
    runtime ? { label: "Runtime", value: runtime } : null,
    status ? { label: "Status", value: status } : null,
    originalLanguage ? { label: "Language", value: originalLanguage } : null,
    studio ? { label: "Studio", value: studio } : null,
  ].filter((row): row is InfoRowData => row != null);

  const openReview = useCallback(
    (rating?: number) => {
      hapticTap();
      router.push(reviewSheetHref({ id: tmdbId, mediaType, title, rating }));
    },
    [router, tmdbId, mediaType, title],
  );

  const shareTitle = useCallback(() => {
    Share.share({ message: title }).catch(() => {});
  }, [title]);

  const openTmdb = useCallback(() => {
    Linking.openURL(
      `https://www.themoviedb.org/${mediaType}/${tmdbId}`,
    ).catch(() => {});
  }, [mediaType, tmdbId]);

  return {
    detail,
    isLoading,
    error,
    width,
    accentHex,
    title,
    tagline,
    backdropUri,
    posterUri,
    year,
    runtime,
    genres,
    status,
    cast,
    infoRows,
    stats,
    histogram,
    reviews,
    myStars,
    hasReview,
    openReview,
    shareTitle,
    openTmdb,
  };
}
