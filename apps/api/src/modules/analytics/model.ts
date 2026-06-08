import { Elysia, t } from "elysia";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);
const range = t.Union([
  t.Literal("week"),
  t.Literal("month"),
  t.Literal("year"),
  t.Literal("all"),
]);
const source = t.Union([
  t.Literal("content"),
  t.Literal("collaborative"),
  t.Literal("trending"),
  t.Literal("availability"),
  t.Literal("social"),
]);

const watchedTime = t.Object({
  exact_minutes: t.Number(),
  estimated_minutes: t.Number(),
  unknown_count: t.Number(),
});

const period = t.Object({
  range,
  timezone: t.String(),
  from: t.String(),
  to: t.String(),
  previous_from: t.Nullable(t.String()),
  previous_to: t.Nullable(t.String()),
});

const currentEra = t.Object({
  decade: t.Nullable(t.Number()),
  label: t.String(),
  count: t.Number(),
  share: t.Number(),
});

const genreCount = t.Object({
  genre: t.String(),
  count: t.Number(),
  share: t.Number(),
});

const watchlistBacklog = t.Object({
  count: t.Number(),
  movie_count: t.Number(),
  tv_count: t.Number(),
  added_in_range: t.Number(),
  watched_in_range: t.Number(),
  per_week: t.Number(),
  weeks_to_clear: t.Nullable(t.Number()),
  oldest_added_at: t.Nullable(t.String()),
});

const overview = t.Object({
  period,
  watched_time: watchedTime,
  total_minutes: t.Number(),
  media_count: t.Number(),
  episode_count: t.Number(),
  average_rating: t.Nullable(t.Number()),
  current_era: currentEra,
  previous: t.Object({
    total_minutes: t.Number(),
    media_count: t.Number(),
    episode_count: t.Number(),
  }),
  deltas: t.Object({
    minutes: t.Number(),
    media_count: t.Number(),
    minutes_pct: t.Nullable(t.Number()),
  }),
  watchlist_backlog: watchlistBacklog,
});

const timelineBucket = t.Object({
  key: t.String(),
  label: t.String(),
  watched_time: watchedTime,
  total_minutes: t.Number(),
  media_count: t.Number(),
  episode_count: t.Number(),
});

const timeline = t.Object({
  period,
  granularity: t.Union([t.Literal("day"), t.Literal("month")]),
  buckets: t.Array(timelineBucket),
});

const timelineItem = t.Object({
  kind: t.Union([t.Literal("media"), t.Literal("episode")]),
  tmdb_id: t.Number(),
  media_type: mediaType,
  title: t.String(),
  poster_path: t.Nullable(t.String()),
  rating: t.Nullable(t.Number()),
  watched_at: t.String(),
  runtime_minutes: t.Nullable(t.Number()),
  season_number: t.Nullable(t.Number()),
  episode_number: t.Nullable(t.Number()),
});

const taste = t.Object({
  period,
  total_logged: t.Number(),
  total_rated: t.Number(),
  genre_mix: t.Array(genreCount),
  highest_rated_genres: t.Array(
    t.Object({ genre: t.String(), avg_rating: t.Number(), count: t.Number() }),
  ),
  rating_distribution: t.Array(t.Number()),
  average_rating: t.Nullable(t.Number()),
  decade_mix: t.Array(
    t.Object({ decade: t.Number(), label: t.String(), count: t.Number(), share: t.Number() }),
  ),
  runtime_mix: t.Array(
    t.Object({
      bucket: t.Union([t.Literal("short"), t.Literal("medium"), t.Literal("long")]),
      label: t.String(),
      count: t.Number(),
    }),
  ),
  media_type_mix: t.Object({ movie: t.Number(), tv: t.Number() }),
  current_era: currentEra,
  contradictions: t.Array(t.Object({ id: t.String(), label: t.String() })),
});

const discoverySourceFlow = t.Object({
  source,
  impressions: t.Number(),
  detail_opens: t.Number(),
  watchlist_adds: t.Number(),
  reviews: t.Number(),
  ratings: t.Number(),
  likes_favorites: t.Number(),
  dismissals: t.Number(),
});

const discoveryTotals = t.Object({
  impressions: t.Number(),
  detail_opens: t.Number(),
  watchlist_adds: t.Number(),
  reviews: t.Number(),
  ratings: t.Number(),
  likes_favorites: t.Number(),
  dismissals: t.Number(),
});

const discoveryFlow = t.Object({
  period,
  by_source: t.Array(discoverySourceFlow),
  totals: discoveryTotals,
});

const shareTemplate = t.Union([t.Literal("weekly"), t.Literal("taste"), t.Literal("watchlist")]);

const shareRecap = t.Object({
  template: shareTemplate,
  period,
  watched_time: t.Optional(watchedTime),
  total_minutes: t.Optional(t.Number()),
  media_count: t.Optional(t.Number()),
  episode_count: t.Optional(t.Number()),
  average_rating: t.Optional(t.Nullable(t.Number())),
  top_genres: t.Optional(t.Array(genreCount)),
  current_era: t.Optional(currentEra),
  media_type_mix: t.Optional(t.Object({ movie: t.Number(), tv: t.Number() })),
  total_logged: t.Optional(t.Number()),
  backlog: t.Optional(
    t.Object({
      count: t.Number(),
      movie_count: t.Number(),
      tv_count: t.Number(),
      per_week: t.Number(),
      weeks_to_clear: t.Nullable(t.Number()),
    }),
  ),
});

export const AnalyticsModel = new Elysia({ name: "Analytics.Model" }).model({
  "analytics.RangeQuery": t.Object({
    range: t.Optional(range),
    timezone: t.Optional(t.String()),
  }),
  "analytics.TimelineItemsQuery": t.Object({
    from: t.String(),
    to: t.String(),
    timezone: t.Optional(t.String()),
  }),
  "analytics.ShareQuery": t.Object({
    template: t.Optional(shareTemplate),
    timezone: t.Optional(t.String()),
  }),
  "analytics.Overview": overview,
  "analytics.Timeline": timeline,
  "analytics.TimelineItems": t.Object({ items: t.Array(timelineItem) }),
  "analytics.Taste": taste,
  "analytics.DiscoveryFlow": discoveryFlow,
  "analytics.ShareRecap": shareRecap,
});

export const analyticsModels = AnalyticsModel.models;
