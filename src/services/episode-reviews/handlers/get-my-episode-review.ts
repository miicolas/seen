import { supabase } from "@/lib/supabase";
import { currentUserId } from "@/services/core";

import type { EpisodeReview } from "../types";

export async function getMyEpisodeReview(params: {
  seriesTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}): Promise<EpisodeReview | null> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("episode_reviews")
    .select("*")
    .match({
      user_id,
      series_tmdb_id: params.seriesTmdbId,
      season_number: params.seasonNumber,
      episode_number: params.episodeNumber,
    })
    .maybeSingle();

  if (error) throw error;
  return data as EpisodeReview | null;
}
