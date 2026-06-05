import { eden, unwrapEden } from "@/lib/eden";

import type { MediaRef, Review } from "../types";

export async function getMyReview({ tmdbId, mediaType }: MediaRef): Promise<Review | null> {
  return unwrapEden<Review | null>(
    eden.reviews.my.get({
      query: { tmdbId, mediaType },
    }),
  );
}
