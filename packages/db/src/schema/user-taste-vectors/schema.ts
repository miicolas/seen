import { integer, jsonb, pgTable, text, timestamp, vector } from "drizzle-orm/pg-core";

import { user } from "../auth";

// Per-user taste vector: a recency-decayed, signal-weighted blend of the media
// feature vectors the user has engaged with, renormalized to unit length. One
// row per user; we query *from* this vector *into* media_features (no kNN across
// users), so no HNSW index is needed here. Rows are skipped when the vector
// collapses to zero (no usable signals).
export const userTasteVectors = pgTable("user_taste_vectors", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  embedding: vector("embedding", { dimensions: 256 }).notNull(),
  encoderVersion: integer("encoder_version").notNull().default(1),
  signalCount: integer("signal_count").notNull().default(0),
  builtAt: timestamp("built_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
