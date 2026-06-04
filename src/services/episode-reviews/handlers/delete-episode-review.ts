import { supabase } from "@/lib/supabase";
import { currentUserId } from "@/services/core";

export async function deleteEpisodeReview(params: {
  seriesTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}): Promise<void> {
  const user_id = await currentUserId();
  const { error } = await supabase
    .from("episode_reviews")
    .delete()
    .match({
      user_id,
      series_tmdb_id: params.seriesTmdbId,
      season_number: params.seasonNumber,
      episode_number: params.episodeNumber,
    });

  if (error) throw error;
}
