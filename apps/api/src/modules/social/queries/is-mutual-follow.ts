import { db } from "@seen/db";
import { follows } from "@seen/db/schema";
import { and, eq, or } from "@seen/db/orm";

export async function isMutualFollow(userA: string, userB: string): Promise<boolean> {
  if (userA === userB) return false;
  const rows = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(
      or(
        and(eq(follows.followerId, userA), eq(follows.followeeId, userB)),
        and(eq(follows.followerId, userB), eq(follows.followeeId, userA)),
      ),
    );
  const directions = new Set(rows.map((row) => row.followerId));
  return directions.has(userA) && directions.has(userB);
}
