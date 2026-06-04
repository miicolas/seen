import { supabase } from "@/lib/supabase";
import { currentUserId } from "@/services/core";

export interface MySeasonEpisodeRating {
  episode_number: number;
  rating: number; // stored 1..10 half-star scale
}

// The signed-in user's own ratings for a season, in one query.
export async function getMySeasonEpisodeRatings(
  seriesTmdbId: number,
  seasonNumber: number,
): Promise<MySeasonEpisodeRating[]> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("episode_reviews")
    .select("episode_number, rating")
    .match({ user_id, series_tmdb_id: seriesTmdbId, season_number: seasonNumber })
    .not("rating", "is", null);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    episode_number: Number(row.episode_number),
    rating: Number(row.rating),
  }));
}
