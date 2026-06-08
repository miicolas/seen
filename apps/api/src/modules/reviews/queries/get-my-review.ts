import { db } from "@seen/db";
import { reviews } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { toApiRow } from "../../../lib/rows";
import type { MediaType } from "../../tmdb";
import { mediaWhere } from "../shared";

export async function getMyReview(userId: string, tmdbId: number, mediaType: MediaType) {
  const [review] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), mediaWhere(tmdbId, mediaType)))
    .limit(1);

  return review ? toApiRow(review) : null;
}
