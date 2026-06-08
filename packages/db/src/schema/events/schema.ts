import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "../auth";

export const interactionEvents = pgTable(
  "interaction_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tmdbId: bigint("tmdb_id", { mode: "number" }),
    mediaType: text("media_type"),
    type: text("type").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("interaction_events_user_idx").on(table.userId, table.createdAt),
    index("interaction_events_media_idx").on(table.tmdbId, table.type),
    check(
      "interaction_events_type_check",
      sql`${table.type} in ('opened_detail', 'viewed_trailer', 'searched', 'search_query', 'shared', 'clicked_streaming', 'added_watchlist', 'removed_watchlist', 'marked_watched', 'rated', 'reviewed', 'liked', 'dismissed', 'not_interested')`,
    ),
    check(
      "interaction_events_media_type_check",
      sql`${table.mediaType} is null or ${table.mediaType} in ('movie', 'tv')`,
    ),
  ],
);

export const recommendationEvents = pgTable(
  "recommendation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    mediaType: text("media_type").notNull(),
    source: text("source").notNull(),
    position: integer("position").notNull(),
    shownAt: timestamp("shown_at", { withTimezone: true }).notNull().defaultNow(),
    clicked: boolean("clicked").notNull().default(false),
    addedToWatchlist: boolean("added_to_watchlist").notNull().default(false),
    markedWatched: boolean("marked_watched").notNull().default(false),
    rated: boolean("rated").notNull().default(false),
    shared: boolean("shared").notNull().default(false),
    dismissed: boolean("dismissed").notNull().default(false),
    timeSpentMs: integer("time_spent_ms"),
  },
  (table) => [
    index("recommendation_events_user_idx").on(table.userId, table.shownAt),
    index("recommendation_events_media_idx").on(table.tmdbId),
    check(
      "recommendation_events_source_check",
      sql`${table.source} in ('content', 'collaborative', 'trending', 'availability', 'social')`,
    ),
    check("recommendation_events_media_type_check", sql`${table.mediaType} in ('movie', 'tv')`),
  ],
);
