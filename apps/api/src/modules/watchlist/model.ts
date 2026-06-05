import { Elysia, t } from "elysia";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);

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
  added_at: t.String(),
  visibility: t.Literal("private"),
});

const itemWithMedia = t.Composite([
  item,
  t.Object({
    media: summary,
  }),
]);

const mediaRefQuery = t.Object({
  tmdbId: t.Numeric(),
  mediaType,
});

export const WatchlistModel = new Elysia({ name: "Watchlist.Model" }).model({
  "watchlist.Item": item,
  "watchlist.ItemWithMedia": itemWithMedia,
  "watchlist.NullableItem": t.Nullable(item),
  "watchlist.MediaRefQuery": mediaRefQuery,
  "watchlist.Input": t.Object({
    tmdb_id: t.Number(),
    media_type: mediaType,
  }),
  "watchlist.ListQuery": t.Object({
    mediaType: t.Optional(mediaType),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
    offset: t.Optional(t.Numeric({ minimum: 0 })),
  }),
  "watchlist.Page": t.Object({
    items: t.Array(itemWithMedia),
    count: t.Number(),
  }),
  "watchlist.DeleteResponse": t.Object({
    ok: t.Boolean(),
  }),
});

export const watchlistModels = WatchlistModel.models;
