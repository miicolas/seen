import type { Href } from "expo-router";

import type { MediaType, TmdbMovieSummary } from "@/lib/tmdb";

export function mediaTitle(media: {
  title?: string;
  original_title?: string;
}): string {
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

export function reviewSheetHref(params: {
  id: number;
  mediaType: MediaType;
  title: string;
  rating?: number;
}): Href {
  return {
    pathname: "/review",
    params: {
      id: String(params.id),
      mediaType: params.mediaType,
      title: params.title,
      ...(params.rating != null ? { rating: String(params.rating) } : {}),
    },
  } as Href;
}
