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

const providerRef = t.Object({
  providerId: t.Number(),
  name: t.String(),
  logoPath: t.Nullable(t.String()),
});

const availableEntry = t.Composite([
  summary,
  t.Object({
    providers: t.Array(providerRef),
    isShort: t.Boolean(),
  }),
]);

export const RecommendationsModel = new Elysia({ name: "Recommendations.Model" }).model({
  "recommendations.AvailableQuery": t.Object({
    region: t.Optional(t.String({ minLength: 2, maxLength: 4 })),
    filter: t.Optional(mediaFilter),
  }),
  "recommendations.AvailableList": t.Array(availableEntry),
  "recommendations.AvailableEntry": availableEntry,
});

export type AvailableEntryDto = Static<typeof availableEntry>;
