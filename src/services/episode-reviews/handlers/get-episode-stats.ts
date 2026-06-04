import { supabase } from "@/lib/supabase";
import { avgStarsFromSumCount } from "@/services/core";

export interface EpisodeStats {
  rating_count: number;
  avg_rating: number | null; // 0.5..5 display scale
  histogram: number[]; // 10 half-star buckets (index 0 = 0.5★ … 9 = 5★)
}

// Community stats for a single episode, read from the denormalized aggregate
// (one indexed row). Null when the episode has no ratings yet.
export async function getEpisodeStats(
  seriesTmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<EpisodeStats | null> {
  const { data, error } = await supabase
    .from("episode_rating_stats")
    .select("sum_rating, rating_count, histogram")
    .match({
      series_tmdb_id: seriesTmdbId,
      season_number: seasonNumber,
      episode_number: episodeNumber,
    })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const count = Number(data.rating_count);
  return {
    rating_count: count,
    avg_rating: avgStarsFromSumCount(Number(data.sum_rating), count),
    histogram: ((data.histogram as number[] | null) ?? []).map(Number),
  };
}
