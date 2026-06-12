import { Elysia, t } from "elysia";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);

const mediaRef = t.Object({
  tmdb_id: t.Number(),
  media_type: mediaType,
});

export const LibraryModel = new Elysia({ name: "Library.Model" }).model({
  "library.Memberships": t.Object({
    watchlist: t.Array(mediaRef),
    likes: t.Array(mediaRef),
    favorites: t.Array(mediaRef),
    not_interested: t.Array(mediaRef),
  }),
});

export const libraryModels = LibraryModel.models;
