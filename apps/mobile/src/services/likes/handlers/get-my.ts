import { eden, unwrapEden } from "@/lib/eden";

import type { LikeMembership, MediaRef } from "../types";

export async function getMyLikes({ tmdbId, mediaType }: MediaRef): Promise<LikeMembership> {
  return unwrapEden<LikeMembership>(
    eden.likes.my.get({
      query: { tmdbId, mediaType },
    }),
  );
}
