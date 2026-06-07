import { Elysia, t } from "elysia";

const target = t.Union([t.Literal("review"), t.Literal("watchlist")]);

const candidate = t.Object({
  tmdb_id: t.Number(),
  title: t.String(),
  release_date: t.Optional(t.String()),
  poster_path: t.Nullable(t.String()),
});

const unmatchedRow = t.Object({
  target,
  title: t.String(),
  year: t.Optional(t.Number()),
  uri: t.Optional(t.String()),
  rating: t.Optional(t.Nullable(t.Number())),
  comment: t.Optional(t.Nullable(t.String())),
  candidates: t.Array(candidate),
});

const summary = t.Object({
  imported: t.Number(),
  skipped: t.Number(),
  unmatched: t.Array(unmatchedRow),
});

export const ImportModel = new Elysia({ name: "Import.Model" }).model({
  "import.Summary": summary,
  // Accept the export .zip or a single .csv; the bytes are sniffed, not the mime
  // (React Native multipart often sends application/octet-stream).
  "import.FileBody": t.Object({
    file: t.File({ maxSize: "25m" }),
  }),
  "import.RssBody": t.Object({
    username: t.String({ minLength: 1, maxLength: 40 }),
  }),
  "import.ResolveBody": t.Object({
    resolutions: t.Array(
      t.Object({
        tmdb_id: t.Number(),
        target,
        rating: t.Optional(t.Nullable(t.Number({ minimum: 1, maximum: 10 }))),
        comment: t.Optional(t.Nullable(t.String())),
      }),
    ),
  }),
});

export const importModels = ImportModel.models;
