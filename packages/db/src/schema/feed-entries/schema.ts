import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "../auth";

// One precomputed "For You" feed entry. A user's feed is the batch of rows
// sharing their latest computed_at; recompute replaces the whole batch. The
// serving layer hydrates display fields from the `movies` cache, so only
// ranking data lives here.
export const feedEntries = pgTable(
  "feed_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    section: text("section").notNull(),
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    mediaType: text("media_type").notNull(),
    source: text("source").notNull(),
    score: real("score").notNull(),
    rank: integer("rank").notNull(),
    // "Because you rated X" anchor; null for non-content sections.
    anchorTitle: text("anchor_title"),
    region: text("region").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("feed_entries_user_idx").on(table.userId, table.computedAt),
    uniqueIndex("feed_entries_user_entry_unique").on(
      table.userId,
      table.section,
      table.tmdbId,
      table.mediaType,
    ),
    check(
      "feed_entries_section_check",
      sql`${table.section} in ('today', 'because_you_rated', 'trending', 'available_tonight', 'discovery')`,
    ),
    check("feed_entries_media_type_check", sql`${table.mediaType} in ('movie', 'tv')`),
    check(
      "feed_entries_source_check",
      sql`${table.source} in ('content', 'collaborative', 'trending', 'availability', 'social')`,
    ),
  ],
);
