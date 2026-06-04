import { supabase } from "@/lib/supabase";
import { currentUserId } from "@/services/core";

import type { EpisodeReview, EpisodeReviewInput } from "../types";

export async function upsertEpisodeReview(
  input: EpisodeReviewInput,
): Promise<EpisodeReview> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("episode_reviews")
    .upsert(
      {
        user_id,
        series_tmdb_id: input.series_tmdb_id,
        episode_tmdb_id: input.episode_tmdb_id,
        season_number: input.season_number,
        episode_number: input.episode_number,
        rating: input.rating ?? null,
        title: input.title ?? null,
        comment: input.comment ?? null,
      },
      {
        onConflict: "user_id,series_tmdb_id,season_number,episode_number",
      },
    )
    .select()
    .single();

  if (error) throw error;
  return data as EpisodeReview;
}
