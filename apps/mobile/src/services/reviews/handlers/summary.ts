import { eden, unwrapEden } from "@/lib/eden";

import type { MediaRef, ReviewSummary } from "../types";

export async function getReviewSummary({ tmdbId, mediaType }: MediaRef): Promise<ReviewSummary> {
  return unwrapEden<ReviewSummary>(
    eden.reviews.summary.get({
      query: { tmdbId, mediaType },
    }),
  );
}
