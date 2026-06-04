import { eden, unwrapEden } from "@/lib/eden";

export interface SeasonEpisodeStat {
  episode_number: number;
  avg: number; // display stars 0.5..5
  rating_count: number;
}

// One indexed read returns the community stats for every rated episode of a
// season; the per-episode average is derived from the denormalized sum/count.
export async function getSeasonEpisodeStats(
  seriesTmdbId: number,
  seasonNumber: number,
): Promise<SeasonEpisodeStat[]> {
  return unwrapEden<SeasonEpisodeStat[]>(
    eden["episode-reviews"].season.stats.get({
      query: { seriesTmdbId, seasonNumber },
    }),
  );
}
