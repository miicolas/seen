import { db } from "@seen/db";
import { likes } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import type { MediaType } from "../../tmdb";
import { toLikeItem } from "../shared";

export async function getMyLikes(userId: string, tmdbId: number, mediaType: MediaType) {
  const rows = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.tmdbId, tmdbId), eq(likes.mediaType, mediaType)));

  const membership: {
    like: ReturnType<typeof toLikeItem> | null;
    favorite: ReturnType<typeof toLikeItem> | null;
  } = { like: null, favorite: null };

  for (const row of rows) {
    membership[row.kind as "like" | "favorite"] = toLikeItem(row);
  }

  return membership;
}
