import { supabase } from "@/lib/supabase";
import type { MediaType } from "@/lib/tmdb";

import type { Review } from "../types";

export async function getMovieReviews(
  tmdbId: number,
  mediaType: MediaType,
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
}
