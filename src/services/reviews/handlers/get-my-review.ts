import { supabase } from "@/lib/supabase";
import { currentUserId } from "@/services/core";

import type { MediaRef, Review } from "../types";

export async function getMyReview({
  tmdbId,
  mediaType,
}: MediaRef): Promise<Review | null> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .match({ user_id, tmdb_id: tmdbId, media_type: mediaType })
    .maybeSingle();
  if (error) throw error;
  return data as Review | null;
}
