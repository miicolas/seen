import { db } from "@seen/db";
import { likes, movies } from "@seen/db/schema";
import { and, count, desc, eq } from "@seen/db/orm";

import type { MediaType } from "../../tmdb";
import type { LikeKind } from "../shared";
import { toLikeItemWithMedia } from "../shared";

export async function getMyLikesPage(
  userId: string,
  kind: LikeKind = "favorite",
  mediaType?: MediaType,
  limit = 20,
  offset = 0,
) {
  const pageSize = Math.max(1, Math.min(50, limit));
  const from = Math.max(0, offset);

  const where = and(
    eq(likes.userId, userId),
    eq(likes.kind, kind),
    mediaType ? eq(likes.mediaType, mediaType) : undefined,
  );

  const mediaJoin = and(eq(likes.tmdbId, movies.tmdbId), eq(likes.mediaType, movies.mediaType));

  const [rows, total] = await Promise.all([
    db
      .select({ likes, media: movies })
      .from(likes)
      .innerJoin(movies, mediaJoin)
      .where(where)
      .orderBy(desc(likes.createdAt))
      .limit(pageSize)
      .offset(from),
    db.select({ count: count() }).from(likes).innerJoin(movies, mediaJoin).where(where),
  ]);

  return {
    items: rows.map(toLikeItemWithMedia),
    count: total[0]?.count ?? 0,
  };
}
