import { Elysia, t } from "elysia";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);

const eventType = t.Union([
  t.Literal("opened_detail"),
  t.Literal("viewed_trailer"),
  t.Literal("searched"),
  t.Literal("search_query"),
  t.Literal("shared"),
  t.Literal("clicked_streaming"),
  t.Literal("added_watchlist"),
  t.Literal("removed_watchlist"),
  t.Literal("marked_watched"),
  t.Literal("rated"),
  t.Literal("reviewed"),
  t.Literal("liked"),
  t.Literal("dismissed"),
  t.Literal("not_interested"),
]);
const source = t.Union([
  t.Literal("content"),
  t.Literal("collaborative"),
  t.Literal("trending"),
  t.Literal("availability"),
  t.Literal("social"),
]);

const interactionEventInput = t.Object({
  type: eventType,
  tmdb_id: t.Optional(t.Number()),
  media_type: t.Optional(mediaType),
  metadata: t.Optional(t.Unknown()),
});

const impressionInput = t.Object({
  tmdb_id: t.Number(),
  media_type: mediaType,
  source,
  position: t.Integer({ minimum: 0 }),
});

const recommendationEvent = t.Object({
  id: t.String(),
  user_id: t.String(),
  tmdb_id: t.Number(),
  media_type: mediaType,
  source,
  position: t.Number(),
  shown_at: t.String(),
  clicked: t.Boolean(),
  added_to_watchlist: t.Boolean(),
  marked_watched: t.Boolean(),
  rated: t.Boolean(),
  shared: t.Boolean(),
  dismissed: t.Boolean(),
  time_spent_ms: t.Nullable(t.Number()),
});

export const EventsModel = new Elysia({ name: "Events.Model" }).model({
  "events.TrackInput": t.Object({
    events: t.Array(interactionEventInput, { maxItems: 100 }),
  }),
  "events.InsertedResponse": t.Object({
    inserted: t.Number(),
  }),
  "events.ImpressionsInput": t.Object({
    impressions: t.Array(impressionInput, { maxItems: 100 }),
  }),
  "events.OutcomeInput": t.Object({
    id: t.String(),
    clicked: t.Optional(t.Boolean()),
    added_to_watchlist: t.Optional(t.Boolean()),
    marked_watched: t.Optional(t.Boolean()),
    rated: t.Optional(t.Boolean()),
    shared: t.Optional(t.Boolean()),
    dismissed: t.Optional(t.Boolean()),
    time_spent_ms: t.Optional(t.Number()),
  }),
  "events.RecommendationEvent": recommendationEvent,
  "events.SuccessRateQuery": t.Object({
    from: t.Optional(t.String()),
    to: t.Optional(t.String()),
  }),
  "events.SuccessRate": t.Object({
    impressions: t.Number(),
    clicked: t.Number(),
    added_to_watchlist: t.Number(),
    marked_watched: t.Number(),
    rated: t.Number(),
    dismissed: t.Number(),
    success_rate: t.Number(),
  }),
});
