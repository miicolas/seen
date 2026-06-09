import type { MediaType } from "@seen/shared";

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

export type { MediaType };
export type MediaFilter = "all" | MediaType;
