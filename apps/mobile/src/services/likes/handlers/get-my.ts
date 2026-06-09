import { api, unwrapEden } from "@/lib/eden";

import type { LikeMembership, MediaRef } from "../types";

export async function getMyLikes({ tmdbId, mediaType }: MediaRef): Promise<LikeMembership> {
  return unwrapEden<LikeMembership>(
    api.likes.my.get({
      query: { tmdbId, mediaType },
    }),
  );
}
