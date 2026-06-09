import { sql } from "drizzle-orm";
import {
  bigint,
  integer,
  numeric,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const mediaRatingStats = pgTable(
  "media_rating_stats",
  {
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    mediaType: text("media_type").notNull(),
    sumRating: bigint("sum_rating", { mode: "number" }).notNull().default(0),
    ratingCount: bigint("rating_count", { mode: "number" }).notNull().default(0),
    reviewCount: bigint("review_count", { mode: "number" }).notNull().default(0),
    histogram: integer("histogram")
      .array()
      .notNull()
      .default(sql`'{0,0,0,0,0,0,0,0,0,0}'::integer[]`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.tmdbId, table.mediaType] })],
);

export const episodeRatingStats = pgTable(
  "episode_rating_stats",
  {
    seriesTmdbId: bigint("series_tmdb_id", { mode: "number" }).notNull(),
    seasonNumber: integer("season_number").notNull(),
    episodeNumber: integer("episode_number").notNull(),
    sumRating: bigint("sum_rating", { mode: "number" }).notNull().default(0),
    ratingCount: bigint("rating_count", { mode: "number" }).notNull().default(0),
    histogram: integer("histogram")
      .array()
      .notNull()
      .default(sql`'{0,0,0,0,0,0,0,0,0,0}'::integer[]`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.seriesTmdbId, table.seasonNumber, table.episodeNumber] }),
  ],
);

export const seriesRatingStats = pgTable("series_rating_stats", {
  seriesTmdbId: bigint("series_tmdb_id", { mode: "number" }).primaryKey(),
  sumOfEpisodeAvgs: numeric("sum_of_episode_avgs", { mode: "number" }).notNull().default(0),
  episodesWithRatings: integer("episodes_with_ratings").notNull().default(0),
  totalRatingCount: bigint("total_rating_count", { mode: "number" }).notNull().default(0),
  histogram: integer("histogram")
    .array()
    .notNull()
    .default(sql`'{0,0,0,0,0,0,0,0,0,0}'::integer[]`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const movieReviewStats = pgView("movie_review_stats", {
  tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
  mediaType: text("media_type").notNull(),
  ratingCount: bigint("rating_count", { mode: "number" }).notNull(),
  avgRating: numeric("avg_rating", { mode: "number" }),
  reviewCount: bigint("review_count", { mode: "number" }).notNull(),
  histogram: integer("histogram").array(),
}).existing();

export const seriesEpisodeReviewStats = pgView("series_episode_review_stats", {
  tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
  mediaType: text("media_type").notNull(),
  ratingCount: bigint("rating_count", { mode: "number" }).notNull(),
  avgRating: numeric("avg_rating", { mode: "number" }),
  reviewCount: bigint("review_count", { mode: "number" }).notNull(),
  histogram: integer("histogram").array(),
}).existing();
