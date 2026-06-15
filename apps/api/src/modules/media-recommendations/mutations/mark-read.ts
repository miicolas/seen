import { db } from "@seen/db";
import { mediaRecommendations } from "@seen/db/schema";
import { and, eq, isNull } from "@seen/db/orm";

export async function markRecommendationRead(
  userId: string,
  recommendationId: string,
): Promise<{ ok: boolean }> {
  await db
    .update(mediaRecommendations)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(mediaRecommendations.id, recommendationId),
        eq(mediaRecommendations.recipientId, userId),
        isNull(mediaRecommendations.readAt),
      ),
    );
  return { ok: true };
}
