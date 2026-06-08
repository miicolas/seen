// TMDB types are derived from the backend DTO contract (single source of truth).
// The API validates/serializes these shapes, so the client trusts them — no
// runtime coercion. Names are kept for the existing `@/lib/tmdb` consumers.
export type {
  MovieDetailDto as TmdbMovieDetail,
  SeasonDetailDto as TmdbTvSeasonDetail,
  EpisodeDetailDto as TmdbTvEpisodeDetail,
  EpisodeSummaryDto as TmdbTvEpisodeSummary,
  SeasonSummaryDto as TmdbTvSeasonSummary,
  CreditDto as TmdbCredit,
  GenreDto,
  SummaryDto as TmdbMovieSummary,
  DiscoverFeedDto as DiscoverFeed,
  GenreRowDto as GenreRow,
  ProviderRefDto as TmdbProviderRef,
  WatchProvidersDto as TmdbWatchProviders,
} from "@seen/api/tmdb";

export type MediaType = "movie" | "tv";
export type MediaFilter = "all" | MediaType;
