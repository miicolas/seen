import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const movies = pgTable(
  "movies",
  {
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    mediaType: text("media_type").notNull(),
    title: text("title").notNull(),
    originalTitle: text("original_title"),
    overview: text("overview"),
    releaseDate: date("release_date"),
    posterPath: text("poster_path"),
    backdropPath: text("backdrop_path"),
    voteAverage: numeric("vote_average", { mode: "number" }),
    voteCount: integer("vote_count"),
    popularity: numeric("popularity", { mode: "number" }),
    runtime: integer("runtime"),
    genres: jsonb("genres"),
    language: text("language").notNull().default("fr-FR"),
    detail: jsonb("detail"),
    detailFetchedAt: timestamp("detail_fetched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tmdbId, table.mediaType] }),
    check("movies_media_type_check", sql`${table.mediaType} in ('movie', 'tv')`),
  ],
);
