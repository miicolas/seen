import { Elysia, t } from "elysia";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);
const mediaFilter = t.Union([t.Literal("all"), mediaType]);

const summary = t.Object({
  id: t.Number(),
  media_type: mediaType,
  title: t.Optional(t.String()),
  original_title: t.Optional(t.String()),
  overview: t.Optional(t.String()),
  release_date: t.Optional(t.String()),
  poster_path: t.Optional(t.Nullable(t.String())),
  backdrop_path: t.Optional(t.Nullable(t.String())),
  vote_average: t.Optional(t.Number()),
  vote_count: t.Optional(t.Number()),
  popularity: t.Optional(t.Number()),
  genre_ids: t.Optional(t.Array(t.Number())),
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
  "tmdb.SeasonParams": t.Object({
    seriesId: t.Numeric(),
    seasonNumber: t.Numeric(),
  }),
  "tmdb.EpisodeParams": t.Object({
    seriesId: t.Numeric(),
    seasonNumber: t.Numeric(),
    episodeNumber: t.Numeric(),
  }),
  "tmdb.GenreRow": t.Object({
    key: t.String(),
    name: t.String(),
    media: t.Array(summary),
  }),
  "tmdb.DiscoverFeed": t.Object({
    trending: t.Array(summary),
    topToday: t.Array(summary),
    newReleases: t.Array(summary),
    genres: t.Array(t.Ref("tmdb.GenreRow")),
  }),
  "tmdb.Detail": t.Record(t.String(), t.Unknown()),
});

export const tmdbModels = TmdbModel.models;
