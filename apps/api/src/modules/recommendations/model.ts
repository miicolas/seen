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
    // How many followed profiles reviewed/rated/watchlisted this title, and a
    // short human reason. 0 / null when no followed profile has engaged with it.
    friendSignalCount: t.Number(),
    friendReason: t.Nullable(t.String()),
  }),
]);

const feedSectionKey = t.Union([
  t.Literal("today"),
  t.Literal("because_you_rated"),
  t.Literal("trending"),
  t.Literal("available_tonight"),
  t.Literal("discovery"),
]);

const recommendationSource = t.Union([
  t.Literal("content"),
  t.Literal("collaborative"),
  t.Literal("trending"),
  t.Literal("availability"),
  t.Literal("social"),
]);

const feedEntry = t.Composite([
  summary,
  t.Object({
    source: recommendationSource,
    providers: t.Array(providerRef),
  }),
]);

const feedSection = t.Object({
  key: feedSectionKey,
  // Which source the client credits for impressions in this shelf.
  source: recommendationSource,
  anchorTitle: t.Nullable(t.String()),
  entries: t.Array(feedEntry),
});

const feedResponse = t.Object({
  sections: t.Array(feedSection),
  coldStart: t.Boolean(),
  computedAt: t.Nullable(t.String()),
});

export const RecommendationsModel = new Elysia({ name: "Recommendations.Model" }).model({
  "recommendations.AvailableQuery": t.Object({
    region: t.Optional(t.String({ minLength: 2, maxLength: 4 })),
    filter: t.Optional(mediaFilter),
  }),
  "recommendations.AvailableList": t.Array(availableEntry),
  "recommendations.AvailableEntry": availableEntry,
  "recommendations.FeedQuery": t.Object({
    region: t.Optional(t.String({ minLength: 2, maxLength: 4 })),
  }),
  "recommendations.FeedResponse": feedResponse,
});

export type AvailableEntryDto = Static<typeof availableEntry>;
export type FeedEntryDto = Static<typeof feedEntry>;
export type FeedSectionDto = Static<typeof feedSection>;
export type FeedResponseDto = Static<typeof feedResponse>;
