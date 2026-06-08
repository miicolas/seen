import type { MediaType } from "./types";

export const profileKeys = {
  me: () => ["profile", "me"] as const,
  activity: () => ["profile", "activity"] as const,
};

export const whatsNewKeys = {
  releases: () => ["whats-new", "releases"] as const,
};

export const accountKeys = {
  session: () => ["account", "session"] as const,
  sessions: () => ["account", "sessions"] as const,
  linked: () => ["account", "linked"] as const,
};

export const discoverKeys = {
  list: (filter: string, locale: string) => ["discover", filter, locale] as const,
};

export const tmdbKeys = {
  detail: (mediaType: MediaType, tmdbId: number, locale: string) =>
    ["tmdb", "detail", mediaType, tmdbId, locale] as const,
};

export const watchProviderKeys = {
  forTitle: (mediaType: MediaType, tmdbId: number, region: string) =>
    ["watch-providers", mediaType, tmdbId, region] as const,
};

export const platformKeys = {
  providers: (region: string) => ["platforms", "providers", region] as const,
  me: (region: string) => ["platforms", "me", region] as const,
};

export const recommendationKeys = {
  all: () => ["recommendations"] as const,
  available: (region: string, filter: string) =>
    ["recommendations", "available", region, filter] as const,
};

export const reviewKeys = {
  my: (mediaType: MediaType, tmdbId: number) => ["reviews", "my", mediaType, tmdbId] as const,
  list: (mediaType: MediaType, tmdbId: number) => ["reviews", "list", mediaType, tmdbId] as const,
  stats: (mediaType: MediaType, tmdbId: number) => ["reviews", "stats", mediaType, tmdbId] as const,
};

export const watchlistKeys = {
  my: (mediaType: MediaType, tmdbId: number) => ["watchlist", "my", mediaType, tmdbId] as const,
  list: (filter: string = "all", search = "") => ["watchlist", "list", filter, search] as const,
};

export const notInterestedKeys = {
  my: (mediaType: MediaType, tmdbId: number) =>
    ["not-interested", "my", mediaType, tmdbId] as const,
  list: () => ["not-interested", "list"] as const,
};

export const likeKeys = {
  my: (mediaType: MediaType, tmdbId: number) => ["likes", "my", mediaType, tmdbId] as const,
  list: (kind: string = "favorite") => ["likes", "list", kind] as const,
};

export const preferenceKeys = {
  me: () => ["preferences", "me"] as const,
  onboardingSeed: () => ["preferences", "onboarding-seed"] as const,
};

export const episodeReviewKeys = {
  my: (seriesTmdbId: number, seasonNumber: number, episodeNumber: number) =>
    ["episode-reviews", "my", seriesTmdbId, seasonNumber, episodeNumber] as const,
  list: (seriesTmdbId: number, seasonNumber: number, episodeNumber: number) =>
    ["episode-reviews", "list", seriesTmdbId, seasonNumber, episodeNumber] as const,
  stats: (seriesTmdbId: number, seasonNumber: number, episodeNumber: number) =>
    ["episode-reviews", "stats", seriesTmdbId, seasonNumber, episodeNumber] as const,
  seasonRatings: (seriesTmdbId: number, seasonNumber: number) =>
    ["episode-reviews", "season-ratings", seriesTmdbId, seasonNumber] as const,
  seasonStats: (seriesTmdbId: number, seasonNumber: number) =>
    ["episode-reviews", "season-stats", seriesTmdbId, seasonNumber] as const,
};
