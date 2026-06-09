import { Elysia, t } from "elysia";
import type { Static } from "@sinclair/typebox";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);
const mediaFilter = t.Union([t.Literal("all"), mediaType]);

const summary = t.Object({
  id: t.Number(),
  media_type: mediaType,
  title: t.Optional(t.String()),
  original_title: t.Optional(t.String()),
  overview: t.Optional(t.String()),
  release_date: t.Optional(t.String()),
  runtime: t.Optional(t.Nullable(t.Number())),
  poster_path: t.Optional(t.Nullable(t.String())),
  backdrop_path: t.Optional(t.Nullable(t.String())),
  vote_average: t.Optional(t.Number()),
  vote_count: t.Optional(t.Number()),
  popularity: t.Optional(t.Number()),
  genre_ids: t.Optional(t.Array(t.Number())),
});

const genre = t.Object({
  id: t.Number(),
  name: t.String(),
});

const keyword = t.Object({
  id: t.Number(),
  name: t.String(),
});

const credit = t.Object({
  id: t.Number(),
  name: t.Optional(t.String()),
  original_name: t.Optional(t.String()),
  character: t.Optional(t.Nullable(t.String())),
  job: t.Optional(t.Nullable(t.String())),
  department: t.Optional(t.Nullable(t.String())),
  profile_path: t.Optional(t.Nullable(t.String())),
});

const seasonSummary = t.Object({
  id: t.Number(),
  name: t.Optional(t.String()),
  overview: t.Optional(t.String()),
  air_date: t.Optional(t.Nullable(t.String())),
  episode_count: t.Optional(t.Number()),
  poster_path: t.Optional(t.Nullable(t.String())),
  season_number: t.Number(),
  vote_average: t.Optional(t.Number()),
});

const episodeSummary = t.Object({
  id: t.Number(),
  name: t.Optional(t.String()),
  overview: t.Optional(t.String()),
  episode_number: t.Number(),
  season_number: t.Number(),
  air_date: t.Optional(t.Nullable(t.String())),
  still_path: t.Optional(t.Nullable(t.String())),
  runtime: t.Optional(t.Nullable(t.Number())),
  vote_average: t.Optional(t.Number()),
  vote_count: t.Optional(t.Number()),
  crew: t.Optional(t.Array(credit)),
  guest_stars: t.Optional(t.Array(credit)),
});

const namedRef = t.Object({ name: t.Optional(t.String()) });

const movieDetail = t.Composite([
  summary,
  t.Object({
    runtime: t.Optional(t.Nullable(t.Number())),
    episode_run_time: t.Optional(t.Array(t.Number())),
    genres: t.Optional(t.Array(genre)),
    number_of_seasons: t.Optional(t.Number()),
    seasons: t.Optional(t.Array(seasonSummary)),
    keywords: t.Optional(t.Array(keyword)),
    tagline: t.Optional(t.Nullable(t.String())),
    status: t.Optional(t.String()),
    original_language: t.Optional(t.String()),
    credits: t.Optional(
      t.Object({
        cast: t.Optional(t.Array(credit)),
        crew: t.Optional(t.Array(credit)),
      }),
    ),
    created_by: t.Optional(t.Array(namedRef)),
    production_companies: t.Optional(t.Array(namedRef)),
    _cache: t.Optional(t.Union([t.Literal("hit"), t.Literal("miss")])),
  }),
]);

const seasonDetail = t.Composite([
  seasonSummary,
  t.Object({
    episodes: t.Optional(t.Array(episodeSummary)),
  }),
]);

const episodeDetail = t.Composite([
  episodeSummary,
  t.Object({
    credits: t.Optional(
      t.Object({
        cast: t.Optional(t.Array(credit)),
        crew: t.Optional(t.Array(credit)),
        guest_stars: t.Optional(t.Array(credit)),
      }),
    ),
  }),
]);

const providerRef = t.Object({
  providerId: t.Number(),
  name: t.String(),
  logoPath: t.Nullable(t.String()),
});

const watchProviders = t.Object({
  region: t.String(),
  link: t.Nullable(t.String()),
  flatrate: t.Array(providerRef),
  rent: t.Array(providerRef),
  buy: t.Array(providerRef),
});

const genreRow = t.Object({
  key: t.String(),
  name: t.String(),
  media: t.Array(summary),
});

const discoverFeed = t.Object({
  trending: t.Array(summary),
  topToday: t.Array(summary),
  newReleases: t.Array(summary),
  genres: t.Array(genreRow),
});

export const TmdbModel = new Elysia({ name: "Tmdb.Model" }).model({
  "tmdb.MediaType": mediaType,
  "tmdb.MediaFilter": mediaFilter,
  "tmdb.Summary": summary,
  "tmdb.SummaryList": t.Array(summary),
  "tmdb.DiscoverQuery": t.Object({
    filter: t.Optional(mediaFilter),
    language: t.Optional(t.String({ minLength: 2, maxLength: 12 })),
  }),
  "tmdb.SearchQuery": t.Object({
    query: t.String({ minLength: 1 }),
    filter: t.Optional(mediaFilter),
    page: t.Optional(t.Numeric({ minimum: 1 })),
    language: t.Optional(t.String({ minLength: 2, maxLength: 12 })),
  }),
  "tmdb.MediaParams": t.Object({
    mediaType,
    tmdbId: t.Numeric(),
  }),
  "tmdb.LanguageQuery": t.Object({
    language: t.Optional(t.String({ minLength: 2, maxLength: 12 })),
  }),
  "tmdb.RegionQuery": t.Object({
    region: t.Optional(t.String({ minLength: 2, maxLength: 4 })),
    language: t.Optional(t.String({ minLength: 2, maxLength: 12 })),
  }),
  "tmdb.WatchProviders": watchProviders,
  "tmdb.ProviderRef": providerRef,
  "tmdb.SeasonParams": t.Object({
    seriesId: t.Numeric(),
    seasonNumber: t.Numeric(),
  }),
  "tmdb.EpisodeParams": t.Object({
    seriesId: t.Numeric(),
    seasonNumber: t.Numeric(),
    episodeNumber: t.Numeric(),
  }),
  "tmdb.GenreRow": genreRow,
  "tmdb.DiscoverFeed": discoverFeed,
  "tmdb.MovieDetail": movieDetail,
  "tmdb.SeasonDetail": seasonDetail,
  "tmdb.EpisodeDetail": episodeDetail,
});

export const tmdbModels = TmdbModel.models;

export type SummaryDto = Static<typeof summary>;
export type GenreDto = Static<typeof genre>;
export type CreditDto = Static<typeof credit>;
export type SeasonSummaryDto = Static<typeof seasonSummary>;
export type EpisodeSummaryDto = Static<typeof episodeSummary>;
export type MovieDetailDto = Static<typeof movieDetail>;
export type SeasonDetailDto = Static<typeof seasonDetail>;
export type EpisodeDetailDto = Static<typeof episodeDetail>;
export type DiscoverFeedDto = Static<typeof discoverFeed>;
export type GenreRowDto = Static<typeof genreRow>;
export type ProviderRefDto = Static<typeof providerRef>;
export type WatchProvidersDto = Static<typeof watchProviders>;
