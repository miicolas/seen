import { supabase } from "@/lib/supabase";
import { avgStarsFromSumCount } from "@/services/core";

export interface SeasonEpisodeStat {
  episode_number: number;
  avg: number; // display stars 0.5..5
  rating_count: number;
}

// One indexed read returns the community stats for every rated episode of a
// season; the per-episode average is derived from the denormalized sum/count.
export async function getSeasonEpisodeStats(
  seriesTmdbId: number,
  seasonNumber: number,
): Promise<SeasonEpisodeStat[]> {
  const { data, error } = await supabase
    .from("episode_rating_stats")
    .select("episode_number, sum_rating, rating_count")
    .match({ series_tmdb_id: seriesTmdbId, season_number: seasonNumber });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const count = Number(row.rating_count);
    return {
      episode_number: Number(row.episode_number),
      rating_count: count,
      avg: avgStarsFromSumCount(Number(row.sum_rating), count) ?? 0,
    };
  });
}
