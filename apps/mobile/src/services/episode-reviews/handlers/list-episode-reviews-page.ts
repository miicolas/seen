import { eden, unwrapEden } from "@/lib/eden";

import type { EpisodeReview } from "../types";

export interface EpisodeRef {
  seriesTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}

export interface PaginatedEpisodeRef extends EpisodeRef {
  limit: number;
  offset: number;
}

export interface EpisodeReviewsPage {
  reviews: EpisodeReview[];
  count: number;
}

export async function getEpisodeReviewsPage({
  seriesTmdbId,
  seasonNumber,
  episodeNumber,
  limit,
  offset,
}: PaginatedEpisodeRef): Promise<EpisodeReviewsPage> {
  return unwrapEden<EpisodeReviewsPage>(
    eden["episode-reviews"].get({
      query: {
        seriesTmdbId,
        seasonNumber,
        episodeNumber,
        limit,
        offset,
      },
    }),
  );
}
