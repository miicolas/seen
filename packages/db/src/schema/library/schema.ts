import { sql } from "drizzle-orm";
import { bigint, check, index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { user } from "../auth";

export const watchlist = pgTable(
  "watchlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    mediaType: text("media_type").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
    visibility: text("visibility").notNull().default("private"),
  },
  (table) => [
    unique("watchlist_user_media_unique").on(table.userId, table.tmdbId, table.mediaType),
    index("watchlist_user_added_idx").on(table.userId, table.addedAt),
    index("watchlist_user_media_type_added_idx").on(table.userId, table.mediaType, table.addedAt),
    check("watchlist_media_type_check", sql`${table.mediaType} in ('movie', 'tv')`),
    check(
      "watchlist_visibility_check",
      sql`${table.visibility} in ('private', 'followers', 'public')`,
    ),
  ],
);

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    mediaType: text("media_type").notNull(),
    kind: text("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("likes_user_media_kind_unique").on(
      table.userId,
      table.tmdbId,
      table.mediaType,
      table.kind,
    ),
    index("likes_user_kind_created_idx").on(table.userId, table.kind, table.createdAt),
    check("likes_media_type_check", sql`${table.mediaType} in ('movie', 'tv')`),
    check("likes_kind_check", sql`${table.kind} in ('like', 'favorite')`),
  ],
);

export const notInterested = pgTable(
  "not_interested",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    mediaType: text("media_type").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("not_interested_user_media_unique").on(table.userId, table.tmdbId, table.mediaType),
    index("not_interested_user_created_idx").on(table.userId, table.createdAt),
    check("not_interested_media_type_check", sql`${table.mediaType} in ('movie', 'tv')`),
  ],
);
