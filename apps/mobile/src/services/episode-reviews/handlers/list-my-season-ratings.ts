import { eden, unwrapEden } from "@/lib/eden";

export interface MySeasonEpisodeRating {
  episode_number: number;
  rating: number; // stored 1..10 half-star scale
}

// The signed-in user's own ratings for a season, in one query.
export async function getMySeasonEpisodeRatings(
  seriesTmdbId: number,
  seasonNumber: number,
): Promise<MySeasonEpisodeRating[]> {
  return unwrapEden<MySeasonEpisodeRating[]>(
    eden["episode-reviews"].season.my.get({
      query: { seriesTmdbId, seasonNumber },
    }),
  );
}
