import { supabase } from "@/lib/supabase";

import type { MediaRef, MediaReviewStats } from "../types";

export async function getMediaStats({
  tmdbId,
  mediaType,
}: MediaRef): Promise<MediaReviewStats | null> {
  const table =
    mediaType === "tv" ? "series_episode_review_stats" : "movie_review_stats";
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .match({ tmdb_id: tmdbId, media_type: mediaType })
    .maybeSingle();
  if (error) throw error;
  return data as MediaReviewStats | null;
}
