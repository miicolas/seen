import { supabase } from "@/lib/supabase";

export async function getTvEpisodeRatings(
  seriesTmdbId: number,
): Promise<number[]> {
  const { data, error } = await supabase
    .from("episode_reviews")
    .select("rating")
    .eq("series_tmdb_id", seriesTmdbId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => Number(row.rating));
}
