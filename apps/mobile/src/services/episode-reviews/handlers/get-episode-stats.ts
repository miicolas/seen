import { eden, unwrapEden } from "@/lib/eden";

export interface EpisodeStats {
  rating_count: number;
  avg_rating: number | null; // 0.5..5 display scale
  histogram: number[]; // 10 half-star buckets (index 0 = 0.5★ … 9 = 5★)
}

// Community stats for a single episode, read from the denormalized aggregate
// (one indexed row). Null when the episode has no ratings yet.
export async function getEpisodeStats(
  seriesTmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<EpisodeStats | null> {
  return unwrapEden<EpisodeStats | null>(
    eden["episode-reviews"].stats.get({
      query: { seriesTmdbId, seasonNumber, episodeNumber },
    }),
  );
}
