import type {
  episodeRatingStats,
  mediaRatingStats,
  movieReviewStats,
  seriesEpisodeReviewStats,
  seriesRatingStats,
} from "./schema";

export type MediaRatingStats = typeof mediaRatingStats.$inferSelect;
export type NewMediaRatingStats = typeof mediaRatingStats.$inferInsert;

export type EpisodeRatingStats = typeof episodeRatingStats.$inferSelect;
export type NewEpisodeRatingStats = typeof episodeRatingStats.$inferInsert;

export type SeriesRatingStats = typeof seriesRatingStats.$inferSelect;
export type NewSeriesRatingStats = typeof seriesRatingStats.$inferInsert;

export type MovieReviewStats = typeof movieReviewStats.$inferSelect;
export type SeriesEpisodeReviewStats = typeof seriesEpisodeReviewStats.$inferSelect;
