import { eden, unwrapEden } from "@/lib/eden";

import type { EpisodeReview, EpisodeReviewInput } from "../types";

export async function upsertEpisodeReview(input: EpisodeReviewInput): Promise<EpisodeReview> {
  return unwrapEden<EpisodeReview>(eden["episode-reviews"].my.put(input));
}
