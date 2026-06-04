import { episodeRatingStats, episodeReviews } from "@seen/db/schema";
import { and, eq } from "drizzle-orm";

export type EpisodeReviewInput = {
  series_tmdb_id: number;
  episode_tmdb_id: number;
  season_number: number;
  episode_number: number;
  rating?: number | null;
  title?: string | null;
  comment?: string | null;
};

export type EpisodeRef = {
  seriesTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
};

export function episodeWhere(params: EpisodeRef) {
  return and(
    eq(episodeReviews.seriesTmdbId, params.seriesTmdbId),
    eq(episodeReviews.seasonNumber, params.seasonNumber),
    eq(episodeReviews.episodeNumber, params.episodeNumber),
  );
}

export function episodeStatsWhere(params: EpisodeRef) {
  return and(
    eq(episodeRatingStats.seriesTmdbId, params.seriesTmdbId),
    eq(episodeRatingStats.seasonNumber, params.seasonNumber),
    eq(episodeRatingStats.episodeNumber, params.episodeNumber),
  );
}

export function avgStarsFromSumCount(sum: number, total: number): number | null {
  return total > 0 ? sum / total / 2 : null;
}
