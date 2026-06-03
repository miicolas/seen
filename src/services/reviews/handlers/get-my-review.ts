import { supabase } from "@/lib/supabase";
import type { MediaType } from "@/lib/tmdb";

import { currentUserId } from "../current-user";
import type { Review } from "../types";

export async function getMyReview(
  tmdbId: number,
  mediaType: MediaType,
): Promise<Review | null> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .match({ user_id, tmdb_id: tmdbId, media_type: mediaType })
    .maybeSingle();
  if (error) throw error;
  return data as Review | null;
}
