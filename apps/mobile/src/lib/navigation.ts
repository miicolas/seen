import type { Href } from "expo-router";

import type { MediaType, TmdbMovieSummary } from "@/lib/tmdb";

export function mediaTitle(media: { title?: string; original_title?: string }): string {
  return media.title ?? media.original_title ?? "Untitled";
}

export function mediaDetailHref(media: TmdbMovieSummary): Href {
  return {
    pathname: "/(tabs)/discover/[id]",
    params: {
      id: String(media.id),
      mediaType: media.media_type,
      title: mediaTitle(media),
      poster_path: media.poster_path ?? "",
      backdrop_path: media.backdrop_path ?? "",
    },
  } as Href;
}

export function imageViewerHref(uri: string): Href {
  return {
    pathname: "/(tabs)/discover/image",
    params: { uri },
  } as Href;
}

// Params shared by the media and episode review sheets.
function buildReviewParams(params: {
  title: string;
  rating?: number;
  poster_path?: string | null;
  mediaSubtitle?: string | null;
}) {
  return {
    title: params.title,
    ...(params.rating != null ? { rating: String(params.rating) } : {}),
    ...(params.poster_path ? { poster_path: params.poster_path } : {}),
    ...(params.mediaSubtitle ? { mediaSubtitle: params.mediaSubtitle } : {}),
  };
}

export function reviewSheetHref(params: {
  id: number;
  mediaType: MediaType;
  title: string;
  rating?: number;
  poster_path?: string | null;
  mediaSubtitle?: string | null;
}): Href {
  return {
    pathname: "/review",
    params: {
      id: String(params.id),
      mediaType: params.mediaType,
      ...buildReviewParams(params),
    },
  } as Href;
}

export function reviewsSheetHref(params: {
  id: number;
  mediaType: MediaType;
  title: string;
}): Href {
  return {
    pathname: "/reviews",
    params: {
      id: String(params.id),
      mediaType: params.mediaType,
      title: params.title,
    },
  } as Href;
}

export function episodeDetailHref(params: {
  seriesId: number;
  episodeTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  seriesTitle: string;
  episodeTitle?: string;
  poster_path?: string | null;
  still_path?: string | null;
}): Href {
  return {
    pathname: "/(tabs)/discover/episode",
    params: {
      seriesId: String(params.seriesId),
      episodeTmdbId: String(params.episodeTmdbId),
      seasonNumber: String(params.seasonNumber),
      episodeNumber: String(params.episodeNumber),
      seriesTitle: params.seriesTitle,
      episodeTitle: params.episodeTitle ?? "",
      poster_path: params.poster_path ?? "",
      still_path: params.still_path ?? "",
    },
  } as Href;
}

export function episodeReviewsListHref(params: {
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
}): Href {
  return {
    pathname: "/episode-reviews",
    params: {
      seriesId: String(params.seriesId),
      seasonNumber: String(params.seasonNumber),
      episodeNumber: String(params.episodeNumber),
      title: params.title,
    },
  } as Href;
}

export function episodeReviewSheetHref(params: {
  seriesId: number;
  episodeTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  rating?: number;
  poster_path?: string | null;
  mediaSubtitle?: string | null;
}): Href {
  return {
    pathname: "/review",
    params: {
      reviewType: "episode",
      seriesId: String(params.seriesId),
      episodeTmdbId: String(params.episodeTmdbId),
      seasonNumber: String(params.seasonNumber),
      episodeNumber: String(params.episodeNumber),
      ...buildReviewParams(params),
    },
  } as Href;
}
