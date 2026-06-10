import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "../auth";

// One precomputed "For You" feed entry. A user's feed is the batch of rows
// sharing their latest computed_at; recompute replaces the whole batch. Since
// the pool model, a batch is one ranked candidate pool (section = 'pool') that
// the serving layer slices into display sections per request with a refresh
// salt; legacy sectionized batches are recomputed on first read. The serving
// layer hydrates display fields from the `movies` cache, so only ranking data
// lives here.
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
    // Raw score components (content/quality/fatigue/...) for sectionizing and
    // observability.
    components: jsonb("components"),
    // "Because you rated X" anchor backing this candidate; null when none.
    anchorTmdbId: bigint("anchor_tmdb_id", { mode: "number" }),
    anchorMediaType: text("anchor_media_type"),
    anchorTitle: text("anchor_title"),
    // Denormalized ranking facets so serving can sectionize without re-joining.
    primaryGenreId: integer("primary_genre_id"),
    directorKey: text("director_key"),
    popularity: real("popularity"),
    voteAverage: real("vote_average"),
    voteCount: integer("vote_count"),
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
      sql`${table.section} in ('pool', 'today', 'because_you_rated', 'trending', 'available_tonight', 'discovery', 'acclaimed', 'hidden_gems')`,
    ),
    check("feed_entries_media_type_check", sql`${table.mediaType} in ('movie', 'tv')`),
    check(
      "feed_entries_source_check",
      sql`${table.source} in ('content', 'collaborative', 'trending', 'availability', 'social')`,
    ),
    check(
      "feed_entries_anchor_media_type_check",
      sql`${table.anchorMediaType} is null or ${table.anchorMediaType} in ('movie', 'tv')`,
    ),
  ],
);
