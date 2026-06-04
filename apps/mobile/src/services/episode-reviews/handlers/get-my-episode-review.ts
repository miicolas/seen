import { eden, unwrapEden } from "@/lib/eden";

import type { EpisodeReview } from "../types";

export async function getMyEpisodeReview(params: {
  seriesTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}): Promise<EpisodeReview | null> {
  return unwrapEden<EpisodeReview | null>(
    eden["episode-reviews"].my.get({
      query: params,
    }),
  );
}
