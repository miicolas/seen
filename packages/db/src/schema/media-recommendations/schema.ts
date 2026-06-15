import { sql } from "drizzle-orm";
import { bigint, check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "../auth";

// One row per (sender → recipient) recommendation of a movie/tv title. Stores a
// display snapshot (title, poster) so the inbox renders without a TMDB round-trip.
export const mediaRecommendations = pgTable(
  "media_recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    message: text("message"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("media_recommendations_recipient_idx").on(
      table.recipientId,
      table.readAt,
      table.createdAt,
    ),
    check("media_recommendations_media_type_check", sql`${table.mediaType} in ('movie', 'tv')`),
    check("media_recommendations_no_self", sql`${table.senderId} <> ${table.recipientId}`),
  ],
);
