import { db } from "@seen/db";
import { mediaRecommendations } from "@seen/db/schema";
import { and, eq, isNull, sql } from "@seen/db/orm";

export async function countUnread(userId: string): Promise<{ count: number }> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mediaRecommendations)
    .where(and(eq(mediaRecommendations.recipientId, userId), isNull(mediaRecommendations.readAt)));
  return { count: row?.count ?? 0 };
}
