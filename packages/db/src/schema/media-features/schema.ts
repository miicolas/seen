import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";

// Deterministic content feature vector for one media title. The embedding is a
// 256-dim L2-normalized vector produced by the similarity encoder; `features`
// keeps the readable token/weight data the vector was built from for debugging.
// `encoderVersion` lets us invalidate rows when the encoder algorithm changes.
export const mediaFeatures = pgTable(
  "media_features",
  {
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    mediaType: text("media_type").notNull(),
    embedding: vector("embedding", { dimensions: 256 }).notNull(),
    features: jsonb("features"),
    encoderVersion: integer("encoder_version").notNull().default(1),
    builtAt: timestamp("built_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tmdbId, table.mediaType] }),
    check("media_features_media_type_check", sql`${table.mediaType} in ('movie', 'tv')`),
    index("media_features_embedding_hnsw").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ],
);
