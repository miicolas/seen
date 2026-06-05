import { Elysia, t } from "elysia";

const episodeRef = t.Object({
  seriesTmdbId: t.Numeric(),
  seasonNumber: t.Numeric(),
  episodeNumber: t.Numeric(),
});

const seasonRef = t.Object({
  seriesTmdbId: t.Numeric(),
  seasonNumber: t.Numeric(),
});

const episodeReview = t.Object({
  id: t.String(),
  user_id: t.String(),
  series_tmdb_id: t.Number(),
  episode_tmdb_id: t.Number(),
  season_number: t.Number(),
  episode_number: t.Number(),
  rating: t.Nullable(t.Number()),
  title: t.Nullable(t.String()),
  comment: t.Nullable(t.String()),
  created_at: t.String(),
  updated_at: t.String(),
});

export const EpisodeReviewModel = new Elysia({
  name: "EpisodeReview.Model",
}).model({
  "episodeReview.Review": episodeReview,
  "episodeReview.NullableReview": t.Nullable(episodeReview),
  "episodeReview.RefQuery": episodeRef,
  "episodeReview.SeasonQuery": seasonRef,
  "episodeReview.ListQuery": t.Object({
    seriesTmdbId: t.Numeric(),
    seasonNumber: t.Numeric(),
    episodeNumber: t.Numeric(),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
    offset: t.Optional(t.Numeric({ minimum: 0 })),
  }),
  "episodeReview.Input": t.Object({
    series_tmdb_id: t.Number(),
    episode_tmdb_id: t.Number(),
    season_number: t.Number(),
    episode_number: t.Number(),
    rating: t.Optional(t.Nullable(t.Number({ minimum: 1, maximum: 10 }))),
    title: t.Optional(t.Nullable(t.String())),
    comment: t.Optional(t.Nullable(t.String())),
  }),
  "episodeReview.Page": t.Object({
    reviews: t.Array(episodeReview),
    count: t.Number(),
  }),
  "episodeReview.Stats": t.Nullable(
    t.Object({
      rating_count: t.Number(),
      avg_rating: t.Nullable(t.Number()),
      histogram: t.Array(t.Number()),
    }),
  ),
  "episodeReview.SeasonStatList": t.Array(
    t.Object({
      episode_number: t.Number(),
      avg: t.Number(),
      rating_count: t.Number(),
    }),
  ),
  "episodeReview.MySeasonRatingList": t.Array(
    t.Object({
      episode_number: t.Number(),
      rating: t.Number(),
    }),
  ),
  "episodeReview.DeleteResponse": t.Object({
    ok: t.Boolean(),
  }),
});

export const episodeReviewModels = EpisodeReviewModel.models;
