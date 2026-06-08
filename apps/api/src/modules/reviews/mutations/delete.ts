import { db } from "@seen/db";
import { reviews } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import type { MediaType } from "../../tmdb";
import { mediaWhere } from "../shared";

export async function deleteReview(userId: string, tmdbId: number, mediaType: MediaType) {
  await db.delete(reviews).where(and(eq(reviews.userId, userId), mediaWhere(tmdbId, mediaType)));
}
