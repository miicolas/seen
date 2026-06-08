import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth";

// Explicit taste preferences, one row per user. Onboarding swipes do NOT write
// here (they write the likes/not-interested signal tables) — this captures the
// user's explicitly-picked favorite/disliked genres and moods from settings.
export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  favoriteGenres: integer("favorite_genres")
    .array()
    .notNull()
    .default(sql`'{}'::integer[]`),
  dislikedGenres: integer("disliked_genres")
    .array()
    .notNull()
    .default(sql`'{}'::integer[]`),
  moods: text("moods")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
