import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "../auth";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    mediaType: text("media_type").notNull(),
    rating: smallint("rating"),
    title: text("title"),
    comment: text("comment"),
    watchedAt: timestamp("watched_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("reviews_user_movie_unique").on(table.userId, table.tmdbId, table.mediaType),
    index("reviews_movie_idx").on(table.tmdbId, table.mediaType, table.createdAt),
    index("reviews_user_idx").on(table.userId, table.createdAt),
    index("reviews_user_watched_idx").on(table.userId, table.watchedAt),
    check("reviews_rating_range", sql`${table.rating} is null or ${table.rating} between 1 and 10`),
    check(
      "reviews_has_content",
      sql`${table.rating} is not null or (${table.title} is not null and length(btrim(${table.title})) > 0) or (${table.comment} is not null and length(btrim(${table.comment})) > 0)`,
    ),
  ],
);

export const episodeReviews = pgTable(
  "episode_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    seriesTmdbId: bigint("series_tmdb_id", { mode: "number" }).notNull(),
    episodeTmdbId: bigint("episode_tmdb_id", { mode: "number" }).notNull(),
    seasonNumber: integer("season_number").notNull(),
    episodeNumber: integer("episode_number").notNull(),
    rating: smallint("rating").notNull(),
    title: text("title"),
    comment: text("comment"),
    runtimeMinutes: integer("runtime_minutes"),
    runtimeConfidence: text("runtime_confidence").notNull().default("unknown"),
    watchedAt: timestamp("watched_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("episode_reviews_user_episode_unique").on(
      table.userId,
      table.seriesTmdbId,
      table.seasonNumber,
      table.episodeNumber,
    ),
    index("episode_reviews_series_idx").on(table.seriesTmdbId, table.createdAt),
    index("episode_reviews_episode_idx").on(
      table.seriesTmdbId,
      table.seasonNumber,
      table.episodeNumber,
      table.createdAt,
    ),
    index("episode_reviews_user_idx").on(table.userId, table.createdAt),
    index("episode_reviews_user_watched_idx").on(table.userId, table.watchedAt),
    check("episode_reviews_season_number_check", sql`${table.seasonNumber} >= 0`),
    check("episode_reviews_episode_number_check", sql`${table.episodeNumber} > 0`),
    check("episode_reviews_rating_range", sql`${table.rating} between 1 and 10`),
    check(
      "episode_reviews_runtime_confidence_check",
      sql`${table.runtimeConfidence} in ('exact', 'estimated', 'unknown')`,
    ),
    check(
      "episode_reviews_has_content",
      sql`${table.rating} is not null or (${table.title} is not null and length(btrim(${table.title})) > 0) or (${table.comment} is not null and length(btrim(${table.comment})) > 0)`,
    ),
  ],
);
