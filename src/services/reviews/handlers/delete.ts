import { supabase } from "@/lib/supabase";
import type { MediaType } from "@/lib/tmdb";

import { currentUserId } from "../current-user";

export async function deleteReview(
  tmdbId: number,
  mediaType: MediaType,
): Promise<void> {
  const user_id = await currentUserId();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .match({ user_id, tmdb_id: tmdbId, media_type: mediaType });
  if (error) throw error;
}
