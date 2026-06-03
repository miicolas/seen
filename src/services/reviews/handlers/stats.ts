import { supabase } from "@/lib/supabase";
import type { MediaType } from "@/lib/tmdb";

import type { MovieReviewStats } from "../types";

export async function getMovieStats(
  tmdbId: number,
  mediaType: MediaType,
): Promise<MovieReviewStats | null> {
  const { data, error } = await supabase
    .from("movie_review_stats")
    .select("*")
    .match({ tmdb_id: tmdbId, media_type: mediaType })
    .maybeSingle();
  if (error) throw error;
  return data as MovieReviewStats | null;
}
