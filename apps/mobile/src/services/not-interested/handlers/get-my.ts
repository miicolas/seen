import { eden, unwrapEden } from "@/lib/eden";

import type { MediaType } from "@/lib/tmdb";
import type { NotInterestedItem } from "../types";

export async function getMyItem({
  tmdbId,
  mediaType,
}: {
  tmdbId: number;
  mediaType: MediaType;
}): Promise<NotInterestedItem | null> {
  return unwrapEden<NotInterestedItem | null>(
    eden["not-interested"].my.get({
      query: { tmdbId, mediaType },
    }),
  );
}
