import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { Linking, Share, useWindowDimensions } from "react-native";

import { useAccentColor } from "@/hooks/use-accent-color";
import { useMediaDetail } from "@/hooks/tmdb/use-media-detail";
import { useMediaReviewPreview } from "@/hooks/reviews/use-media-reviews";
import { useMediaStats } from "@/hooks/reviews/use-media-stats";
import { useMyReview } from "@/hooks/reviews/use-my-review";
import { useLikesMembership } from "@/hooks/likes/use-likes-membership";
import { useNotInterestedMembership } from "@/hooks/not-interested/use-not-interested-membership";
import { useWatchlistMembership } from "@/hooks/watchlist/use-watchlist-membership";
import { hapticTap } from "@/lib/haptics";
import { reviewSheetHref, reviewsSheetHref } from "@/lib/navigation";
import { tmdbImageUrl, type MediaType } from "@/lib/tmdb";
import { track } from "@/services/events";
import { ratingToStars } from "@/services/reviews";

import { formatDate, releaseYear } from "@/lib/format";

import { metaLine } from "./utils";
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
  const watchlist = useWatchlistMembership(tmdbId, mediaType);
  const refetchWatchlist = watchlist.refetch;
  const toggleWatchlistMutation = watchlist.toggle;
  const likes = useLikesMembership(tmdbId, mediaType);
  const refetchLikes = likes.refetch;
  const toggleLikeMutation = likes.toggleLike;
  const toggleFavoriteMutation = likes.toggleFavorite;
  const notInterested = useNotInterestedMembership(tmdbId, mediaType);
  const refetchNotInterested = notInterested.refetch;
  const toggleNotInterestedMutation = notInterested.toggle;
  const {
    reviews,
    count: reviewCount,
    refetch: refetchReviews,
  } = useMediaReviewPreview(tmdbId, mediaType);
  const { stats, refetch: refetchStats } = useMediaStats(tmdbId, mediaType);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchWatchlist();
      refetchLikes();
      refetchNotInterested();
      refetchReviews();
      refetchStats();
    }, [
      refetch,
      refetchLikes,
      refetchNotInterested,
      refetchReviews,
      refetchStats,
      refetchWatchlist,
    ]),
  );

  useEffect(() => {
    if (Number.isFinite(tmdbId) && tmdbId > 0) {
      track("opened_detail", { tmdbId, mediaType });
    }
  }, [tmdbId, mediaType]);

  const title = detail?.title ?? params.title ?? "Untitled";
  const posterPath =
    detail?.poster_path ??
    params.poster_path ??
    detail?.backdrop_path ??
    params.backdrop_path ??
    null;
  const backdropUri = tmdbImageUrl(detail?.backdrop_path ?? params.backdrop_path ?? null, "w1280");
  const posterUri = tmdbImageUrl(posterPath, "w500");

  const year = releaseYear(detail?.release_date);
  const episodeRuntime = detail?.episode_run_time?.[0];
  const runtime = detail?.runtime
    ? `${detail.runtime} min`
    : episodeRuntime
      ? `${episodeRuntime} min`
      : undefined;
  const genres = detail?.genres?.map((g) => g.name).join(", ") || undefined;
  const mediaSubtitle = metaLine([year, runtime, genres]);
  const seasonCount =
    typeof detail?.number_of_seasons === "number" ? `${detail.number_of_seasons}` : undefined;
  const tagline =
    typeof detail?.tagline === "string" && detail.tagline.length > 0 ? detail.tagline : undefined;
  const status = typeof detail?.status === "string" ? detail.status : undefined;
  const seasons = detail?.seasons ?? [];

  const credits = detail?.credits as { cast?: CastMember[]; crew?: CrewMember[] } | undefined;
  const cast = (credits?.cast ?? []).slice(0, 16);
  const createdBy = detail?.created_by
    ?.map((c) => c.name)
    .filter(Boolean)
    .join(", ");
  const director =
    mediaType === "tv"
      ? createdBy || undefined
      : credits?.crew?.find((c) => c.job === "Director")?.name;
  const studio = detail?.production_companies?.[0]?.name;
  const originalLanguage =
    typeof detail?.original_language === "string"
      ? detail.original_language.toUpperCase()
      : undefined;

  const myStars =
    mediaType === "movie" && review?.rating != null ? ratingToStars(review.rating) : 0;
  const hasRating = myStars > 0;
  const hasReview = mediaType === "movie" && review != null;

  const infoRows: InfoRowData[] = [
    director ? { label: mediaType === "tv" ? "Creator" : "Director", value: director } : null,
    seasonCount ? { label: "Seasons", value: seasonCount } : null,
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
      router.push(
        reviewSheetHref({
          id: tmdbId,
          mediaType,
          title,
          rating,
          poster_path: posterPath,
          mediaSubtitle,
        }),
      );
    },
    [router, tmdbId, mediaType, title, posterPath, mediaSubtitle],
  );

  const openReviews = useCallback(() => {
    if (mediaType !== "movie") return;
    hapticTap();
    router.push(
      reviewsSheetHref({
        id: tmdbId,
        mediaType,
        title,
      }),
    );
  }, [mediaType, router, title, tmdbId]);

  const toggleWatchlist = useCallback(() => {
    toggleWatchlistMutation().catch(() => {});
  }, [toggleWatchlistMutation]);

  const toggleLike = useCallback(() => {
    hapticTap();
    toggleLikeMutation().catch(() => {});
  }, [toggleLikeMutation]);

  const toggleFavorite = useCallback(() => {
    hapticTap();
    toggleFavoriteMutation().catch(() => {});
  }, [toggleFavoriteMutation]);

  const toggleNotInterested = useCallback(() => {
    hapticTap();
    toggleNotInterestedMutation().catch(() => {});
  }, [toggleNotInterestedMutation]);

  const shareTitle = useCallback(() => {
    Share.share({ message: title }).catch(() => {});
  }, [title]);

  const openTmdb = useCallback(() => {
    Linking.openURL(`https://www.themoviedb.org/${mediaType}/${tmdbId}`).catch(() => {});
  }, [mediaType, tmdbId]);

  return {
    detail,
    mediaType,
    tmdbId,
    isLoading,
    error,
    width,
    accentHex,
    title,
    tagline,
    backdropUri,
    posterPath,
    posterUri,
    year,
    runtime,
    genres,
    status,
    seasons,
    cast,
    infoRows,
    stats,
    reviews: mediaType === "tv" ? [] : reviews,
    reviewCount: mediaType === "tv" ? 0 : reviewCount,
    myStars,
    hasRating,
    hasReview,
    isInWatchlist: watchlist.isInWatchlist,
    isWatchlistSaving: watchlist.isSaving,
    toggleWatchlist,
    isLiked: likes.isLiked,
    isFavorited: likes.isFavorited,
    isLikeSaving: likes.isLikeSaving,
    isFavoriteSaving: likes.isFavoriteSaving,
    toggleLike,
    toggleFavorite,
    isDismissed: notInterested.isDismissed,
    isNotInterestedSaving: notInterested.isSaving,
    toggleNotInterested,
    openReview,
    openReviews,
    shareTitle,
    openTmdb,
  };
}
