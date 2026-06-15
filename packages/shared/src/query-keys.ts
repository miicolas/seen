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
  recommendations: (mediaType: MediaType, tmdbId: number, locale: string) =>
    ["tmdb", "recommendations", mediaType, tmdbId, locale] as const,
  person: (personId: number, locale: string) => ["tmdb", "person", personId, locale] as const,
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
  feed: (region: string) => ["recommendations", "feed", region] as const,
};

export const socialKeys = {
  all: () => ["social"] as const,
  searches: () => ["social", "search"] as const,
  search: (term: string) => ["social", "search", term] as const,
  profiles: () => ["social", "profile"] as const,
  profile: (profileId: string) => ["social", "profile", profileId] as const,
  profileActivity: (profileId: string) => ["social", "profile", profileId, "activity"] as const,
  profileWatchlist: (profileId: string) => ["social", "profile", profileId, "watchlist"] as const,
  followers: (profileId: string) => ["social", "profile", profileId, "followers"] as const,
  following: (profileId: string) => ["social", "profile", profileId, "following"] as const,
  activity: () => ["social", "activity"] as const,
  requests: () => ["social", "requests"] as const,
  contactMatches: () => ["social", "contact-matches"] as const,
};

export const reviewKeys = {
  my: (mediaType: MediaType, tmdbId: number) => ["reviews", "my", mediaType, tmdbId] as const,
  list: (mediaType: MediaType, tmdbId: number) => ["reviews", "list", mediaType, tmdbId] as const,
  summary: (mediaType: MediaType, tmdbId: number) =>
    ["reviews", "summary", mediaType, tmdbId] as const,
};

export const libraryKeys = {
  memberships: () => ["library", "memberships"] as const,
};

export const watchlistKeys = {
  list: (filter: string = "all", search = "") => ["watchlist", "list", filter, search] as const,
};

export const notInterestedKeys = {
  list: () => ["not-interested", "list"] as const,
};

export const likeKeys = {
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

export const watchSessionKeys = {
  all: () => ["watch-sessions"] as const,
  current: () => ["watch-sessions", "current"] as const,
  detail: (sessionId: string) => ["watch-sessions", "detail", sessionId] as const,
  invitations: () => ["watch-sessions", "invitations"] as const,
  invitableFriends: (sessionId: string) =>
    ["watch-sessions", "invitable-friends", sessionId] as const,
};

export const analyticsKeys = {
  // Broad key for blanket invalidation after any action that changes what the
  // Insights screen reads (a review, watchlist edit, like, import, …).
  all: () => ["analytics"] as const,
  overview: (range: string, timezone: string, offset = 0) =>
    ["analytics", "overview", range, offset, timezone] as const,
  series: (range: string, timezone: string, offset = 0) =>
    ["analytics", "series", range, offset, timezone] as const,
  streaks: (timezone: string) => ["analytics", "streaks", timezone] as const,
  timelineItems: (from: string, to: string, timezone: string) =>
    ["analytics", "timeline-items", from, to, timezone] as const,
  taste: (range: string, timezone: string, offset = 0) =>
    ["analytics", "taste", range, offset, timezone] as const,
  discoveryFlow: (range: string, timezone: string) =>
    ["analytics", "discovery-flow", range, timezone] as const,
  shareRecap: (template: string, timezone: string) =>
    ["analytics", "share-recap", template, timezone] as const,
};
