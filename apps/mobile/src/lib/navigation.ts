import type { Href } from "expo-router";

import type { MediaType } from "@/lib/tmdb";

// Which tab Stack owns the media-detail route tree. The detail screen lives in
// the home, discover, watchlist, profile and insights stacks so navigation (and
// the back/zoom transition) stays within the tab the user came from.
export type MediaRouteBase = "home" | "discover" | "watchlist" | "profile" | "insights";

export function mediaTitle(media: {
  title?: string | null;
  original_title?: string | null;
}): string {
  return media.title ?? media.original_title ?? "Untitled";
}

// The minimum a media object needs to drive the detail route (full
// TmdbMovieSummary objects satisfy this, as does a hand-built activity item).
export type MediaDetailLink = {
  id: number;
  media_type: MediaType;
  title?: string | null;
  original_title?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
};

export function mediaDetailHref(media: MediaDetailLink, base: MediaRouteBase = "discover"): Href {
  return {
    pathname: `/(tabs)/${base}/[id]`,
    params: {
      id: String(media.id),
      mediaType: media.media_type,
      title: mediaTitle(media),
      poster_path: media.poster_path ?? "",
      backdrop_path: media.backdrop_path ?? "",
    },
  } as Href;
}

export function imageViewerHref(uri: string, base: MediaRouteBase = "discover"): Href {
  return {
    pathname: `/(tabs)/${base}/image`,
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

export function episodeDetailHref(
  params: {
    seriesId: number;
    episodeTmdbId: number;
    seasonNumber: number;
    episodeNumber: number;
    seriesTitle: string;
    episodeTitle?: string;
    poster_path?: string | null;
    still_path?: string | null;
  },
  base: MediaRouteBase = "discover",
): Href {
  return {
    pathname: `/(tabs)/${base}/episode`,
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

export function nowWatchingHref(sessionId: string): Href {
  return {
    pathname: "/now-watching",
    params: { sessionId },
  } as Href;
}

export function watchInviteHref(sessionId: string): Href {
  return {
    pathname: "/watch-invite",
    params: { sessionId },
  } as Href;
}

// Social routes live under the profile tab's `social/` segment so they don't
// collide with the media-detail `[id]` route. See AGENTS.md "Screens vs routes".
export type ConnectionsKind = "followers" | "following";

export function findFriendsHref(): Href {
  return "/(tabs)/profile/social/search" as Href;
}

export function followRequestsHref(): Href {
  return "/(tabs)/profile/social/requests" as Href;
}

export function privacyHref(): Href {
  return "/(tabs)/profile/privacy" as Href;
}

export function socialProfileHref(profileId: string): Href {
  return {
    pathname: "/(tabs)/profile/social/[profileId]",
    params: { profileId },
  } as Href;
}

export function connectionsHref(profileId: string, kind: ConnectionsKind, title: string): Href {
  return {
    pathname: "/(tabs)/profile/social/connections",
    params: { profileId, kind, title },
  } as Href;
}
