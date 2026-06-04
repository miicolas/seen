import { supabase } from "@/lib/supabase";
import { currentUserId } from "@/services/core";

import type { MediaRef } from "../types";

export async function deleteReview({
  tmdbId,
  mediaType,
}: MediaRef): Promise<void> {
  const user_id = await currentUserId();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .match({ user_id, tmdb_id: tmdbId, media_type: mediaType });
  if (error) throw error;
}
