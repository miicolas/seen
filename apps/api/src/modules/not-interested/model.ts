import { Elysia, t } from "elysia";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);

const item = t.Object({
  id: t.String(),
  user_id: t.String(),
  tmdb_id: t.Number(),
  media_type: mediaType,
  reason: t.Nullable(t.String()),
  created_at: t.String(),
});

const mediaRefQuery = t.Object({
  tmdbId: t.Numeric(),
  mediaType,
});

export const NotInterestedModel = new Elysia({ name: "NotInterested.Model" }).model({
  "not-interested.Item": item,
  "not-interested.NullableItem": t.Nullable(item),
  "not-interested.MediaRefQuery": mediaRefQuery,
  "not-interested.Input": t.Object({
    tmdb_id: t.Number(),
    media_type: mediaType,
    reason: t.Optional(t.String()),
  }),
  "not-interested.List": t.Array(item),
  "not-interested.DeleteResponse": t.Object({
    ok: t.Boolean(),
  }),
});
