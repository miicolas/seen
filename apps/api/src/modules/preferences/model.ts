import { Elysia, t } from "elysia";
import type { Static } from "@sinclair/typebox";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);

const input = t.Object({
  favorite_genres: t.Array(t.Integer()),
  disliked_genres: t.Array(t.Integer()),
  moods: t.Array(t.String()),
});

// The stored shape is the input plus the server-managed timestamp.
const me = t.Composite([input, t.Object({ updated_at: t.Nullable(t.String()) })]);

// Card payload for the onboarding swipe deck — a subset of the TMDB summary
// shape so the client can render it with its existing poster components.
const seedItem = t.Object({
  id: t.Number(),
  media_type: mediaType,
  title: t.Optional(t.String()),
  original_title: t.Optional(t.String()),
  overview: t.Optional(t.String()),
  release_date: t.Optional(t.String()),
  poster_path: t.Optional(t.Nullable(t.String())),
  backdrop_path: t.Optional(t.Nullable(t.String())),
  vote_average: t.Optional(t.Number()),
  genre_ids: t.Optional(t.Array(t.Number())),
});

const seedList = t.Array(seedItem);

const swipeItem = t.Object({
  tmdb_id: t.Number(),
  media_type: mediaType,
  choice: t.Union([t.Literal("like"), t.Literal("dislike")]),
});

const swipeBatch = t.Object({
  items: t.Array(swipeItem, { maxItems: 100 }),
});

const swipeResult = t.Object({
  liked: t.Number(),
  disliked: t.Number(),
});

const excludeItem = t.Object({
  tmdb_id: t.Number(),
  media_type: mediaType,
});

// Stateless adaptive-deck request: the client owns the session (its swipe
// history and everything already shown or queued) and asks for the next cards.
const nextRequest = t.Object({
  swipes: t.Array(swipeItem, { maxItems: 50 }),
  exclude: t.Array(excludeItem, { maxItems: 100 }),
  count: t.Integer({ minimum: 1, maximum: 6, default: 3 }),
});

export const PreferencesModel = new Elysia({ name: "Preferences.Model" }).model({
  "preferences.Me": me,
  "preferences.Input": input,
  "preferences.SeedList": seedList,
  "preferences.SwipeBatch": swipeBatch,
  "preferences.SwipeResult": swipeResult,
  "preferences.NextRequest": nextRequest,
});

export type PreferencesMeDto = Static<typeof me>;
export type PreferencesInputDto = Static<typeof input>;
export type SeedItemDto = Static<typeof seedItem>;
export type SwipeItemDto = Static<typeof swipeItem>;
export type SwipeResultDto = Static<typeof swipeResult>;
export type OnboardingNextRequestDto = Static<typeof nextRequest>;
