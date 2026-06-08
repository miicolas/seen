import { eden, unwrapEden } from "@/lib/eden";

import type { LikeKind, MediaRef } from "../types";

export async function removeLike({
  tmdbId,
  mediaType,
  kind,
}: MediaRef & { kind: LikeKind }): Promise<void> {
  await unwrapEden<{ ok: boolean }>(
    eden.likes.my.delete(undefined, {
      query: { tmdbId, mediaType, kind },
    }),
  );
}
