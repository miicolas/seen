import { db } from "@seen/db";
import { notInterested } from "@seen/db/schema";

import type { MediaType } from "../../tmdb";
import { notInterestedWhere, toNotInterestedItem } from "../shared";

export async function getMyItem(userId: string, tmdbId: number, mediaType: MediaType) {
  const [item] = await db
    .select()
    .from(notInterested)
    .where(notInterestedWhere(userId, tmdbId, mediaType))
    .limit(1);

  return item ? toNotInterestedItem(item) : null;
}
