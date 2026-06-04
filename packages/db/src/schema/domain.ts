import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  pgView,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

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

export const profiles = pgTable(
  "profiles",
  {
    id: text("id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    username: text("username").notNull().unique(),
    avatarPath: text("avatar_path"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("profiles_full_name_not_blank", sql`length(btrim(${table.fullName})) > 0`),
    check(
      "profiles_username_format",
      sql`${table.username} = lower(${table.username}) and ${table.username} ~ '^[a-z0-9_.]{3,20}$'`,
    ),
  ],
);

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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("reviews_user_movie_unique").on(table.userId, table.tmdbId, table.mediaType),
    index("reviews_movie_idx").on(table.tmdbId, table.mediaType, table.createdAt),
    index("reviews_user_idx").on(table.userId, table.createdAt),
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
    check("episode_reviews_season_number_check", sql`${table.seasonNumber} >= 0`),
    check("episode_reviews_episode_number_check", sql`${table.episodeNumber} > 0`),
    check("episode_reviews_rating_range", sql`${table.rating} between 1 and 10`),
    check(
      "episode_reviews_has_content",
      sql`${table.rating} is not null or (${table.title} is not null and length(btrim(${table.title})) > 0) or (${table.comment} is not null and length(btrim(${table.comment})) > 0)`,
    ),
  ],
);

export const mediaRatingStats = pgTable(
  "media_rating_stats",
  {
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    mediaType: text("media_type").notNull(),
    sumRating: bigint("sum_rating", { mode: "number" }).notNull().default(0),
    ratingCount: bigint("rating_count", { mode: "number" }).notNull().default(0),
    reviewCount: bigint("review_count", { mode: "number" }).notNull().default(0),
    histogram: integer("histogram").array().notNull().default(sql`'{0,0,0,0,0,0,0,0,0,0}'::integer[]`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
    histogram: integer("histogram").array().notNull().default(sql`'{0,0,0,0,0,0,0,0,0,0}'::integer[]`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.seriesTmdbId, table.seasonNumber, table.episodeNumber] })],
);

export const seriesRatingStats = pgTable("series_rating_stats", {
  seriesTmdbId: bigint("series_tmdb_id", { mode: "number" }).primaryKey(),
  sumOfEpisodeAvgs: numeric("sum_of_episode_avgs", { mode: "number" }).notNull().default(0),
  episodesWithRatings: integer("episodes_with_ratings").notNull().default(0),
  totalRatingCount: bigint("total_rating_count", { mode: "number" }).notNull().default(0),
  histogram: integer("histogram").array().notNull().default(sql`'{0,0,0,0,0,0,0,0,0,0}'::integer[]`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
