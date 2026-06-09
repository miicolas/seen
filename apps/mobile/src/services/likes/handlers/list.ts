import { api, unwrapEden } from "@/lib/eden";

import type { LikesListInput, LikesPage } from "../types";

export async function getMyLikesPage({
  kind = "favorite",
  mediaType,
  limit,
  offset,
}: LikesListInput = {}): Promise<LikesPage> {
  return unwrapEden<LikesPage>(
    api.likes.get({
      query: { kind, mediaType, limit, offset },
    }),
  );
}
