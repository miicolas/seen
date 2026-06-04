import { supabase } from "@/lib/supabase";

import type { EpisodeReview } from "../types";

export interface EpisodeRef {
  seriesTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}

export interface PaginatedEpisodeRef extends EpisodeRef {
  limit: number;
  offset: number;
}

export interface EpisodeReviewsPage {
  reviews: EpisodeReview[];
  count: number;
}

// Feed of all reviews for one episode, newest first. Served by the existing
// episode_reviews_episode_idx (series, season, episode, created_at desc).
export async function getEpisodeReviewsPage({
  seriesTmdbId,
  seasonNumber,
  episodeNumber,
  limit,
  offset,
}: PaginatedEpisodeRef): Promise<EpisodeReviewsPage> {
  const from = Math.max(0, offset);
  const pageSize = Math.max(1, limit);
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("episode_reviews")
    .select("*", { count: "exact" })
    .match({
      series_tmdb_id: seriesTmdbId,
      season_number: seasonNumber,
      episode_number: episodeNumber,
    })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  return { reviews: (data ?? []) as EpisodeReview[], count: count ?? 0 };
}
