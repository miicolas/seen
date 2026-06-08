import { Elysia, t } from "elysia";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);
const kind = t.Union([t.Literal("like"), t.Literal("favorite")]);

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

const item = t.Object({
  id: t.String(),
  user_id: t.String(),
  tmdb_id: t.Number(),
  media_type: mediaType,
  kind,
  created_at: t.String(),
});

const itemWithMedia = t.Composite([
  item,
  t.Object({
    media: summary,
  }),
]);

export const LikesModel = new Elysia({ name: "Likes.Model" }).model({
  "likes.Item": item,
  "likes.ItemWithMedia": itemWithMedia,
  "likes.Membership": t.Object({
    like: t.Nullable(item),
    favorite: t.Nullable(item),
  }),
  "likes.MediaRefQuery": t.Object({
    tmdbId: t.Numeric(),
    mediaType,
  }),
  "likes.DeleteQuery": t.Object({
    tmdbId: t.Numeric(),
    mediaType,
    kind,
  }),
  "likes.Input": t.Object({
    tmdb_id: t.Number(),
    media_type: mediaType,
    kind,
  }),
  "likes.ListQuery": t.Object({
    kind: t.Optional(kind),
    mediaType: t.Optional(mediaType),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
    offset: t.Optional(t.Numeric({ minimum: 0 })),
  }),
  "likes.Page": t.Object({
    items: t.Array(itemWithMedia),
    count: t.Number(),
  }),
  "likes.DeleteResponse": t.Object({
    ok: t.Boolean(),
  }),
});

export const likesModels = LikesModel.models;
