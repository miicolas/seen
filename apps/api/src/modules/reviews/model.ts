import { Elysia, t } from "elysia";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);

const review = t.Object({
  id: t.String(),
  user_id: t.String(),
  tmdb_id: t.Number(),
  media_type: mediaType,
  rating: t.Nullable(t.Number()),
  title: t.Nullable(t.String()),
  comment: t.Nullable(t.String()),
  watched_at: t.String(),
  created_at: t.String(),
  updated_at: t.String(),
});

const mediaRefQuery = t.Object({
  tmdbId: t.Numeric(),
  mediaType,
});

const stats = t.Nullable(
  t.Object({
    tmdb_id: t.Number(),
    media_type: mediaType,
    rating_count: t.Number(),
    avg_rating: t.Nullable(t.Number()),
    review_count: t.Number(),
    histogram: t.Nullable(t.Array(t.Number())),
  }),
);

export const ReviewModel = new Elysia({ name: "Review.Model" }).model({
  "review.Review": review,
  "review.NullableReview": t.Nullable(review),
  "review.MediaRefQuery": mediaRefQuery,
  "review.ListQuery": t.Object({
    tmdbId: t.Numeric(),
    mediaType,
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
    offset: t.Optional(t.Numeric({ minimum: 0 })),
  }),
  "review.Input": t.Object({
    tmdb_id: t.Number(),
    media_type: mediaType,
    rating: t.Optional(t.Nullable(t.Number({ minimum: 1, maximum: 10 }))),
    title: t.Optional(t.Nullable(t.String())),
    comment: t.Optional(t.Nullable(t.String())),
    watched_at: t.Optional(t.Nullable(t.String())),
  }),
  "review.Page": t.Object({
    reviews: t.Array(review),
    count: t.Number(),
  }),
  "review.Stats": stats,
  "review.Summary": t.Object({
    my_review: t.Nullable(review),
    reviews: t.Array(review),
    count: t.Number(),
    stats,
  }),
  "review.DeleteResponse": t.Object({
    ok: t.Boolean(),
  }),
});

export const reviewModels = ReviewModel.models;
