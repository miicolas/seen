import { db } from "@seen/db";
import { follows, reviews } from "@seen/db/schema";
import { inArray, sql } from "@seen/db/orm";

export type MutualFollower = { id: string; full_name: string };

export type SocialContext = {
  followersCount: number;
  seenCount: number;
  mutualFollowers: MutualFollower[];
  mutualFollowersCount: number;
};

const MUTUALS_PER_PROFILE = 2;

function defaultSocialContext(): SocialContext {
  return { followersCount: 0, seenCount: 0, mutualFollowers: [], mutualFollowersCount: 0 };
}

type MutualRow = {
  followee_id: string;
  follower_id: string;
  full_name: string;
  total: number;
};

// Social context for each of `targetIds`, resolved in three batched reads:
// follower counts, seen-title counts (one review row per title), and "followed
// by" mutuals — people the viewer follows who follow the target. Mutuals only
// surface names the viewer already knows, so nothing private leaks.
export async function getSocialContexts(
  viewerId: string,
  targetIds: string[],
): Promise<Map<string, SocialContext>> {
  const contexts = new Map<string, SocialContext>();
  const ids = [...new Set(targetIds)];
  for (const id of ids) contexts.set(id, defaultSocialContext());
  if (ids.length === 0) return contexts;

  const idList = sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );

  const [followerRows, seenRows, mutualResult] = await Promise.all([
    db
      .select({ id: follows.followeeId, value: sql<number>`count(*)::int` })
      .from(follows)
      .where(inArray(follows.followeeId, ids))
      .groupBy(follows.followeeId),
    db
      .select({ id: reviews.userId, value: sql<number>`count(*)::int` })
      .from(reviews)
      .where(inArray(reviews.userId, ids))
      .groupBy(reviews.userId),
    db.execute<MutualRow>(sql`
      SELECT ranked.followee_id, ranked.follower_id, p.full_name, ranked.total
      FROM (
        SELECT f.followee_id, f.follower_id,
               ROW_NUMBER() OVER (PARTITION BY f.followee_id ORDER BY f.created_at DESC) AS rn,
               COUNT(*) OVER (PARTITION BY f.followee_id)::int AS total
        FROM follows f
        WHERE f.followee_id IN (${idList})
          AND f.follower_id IN (
            SELECT followee_id FROM follows WHERE follower_id = ${viewerId}
          )
      ) ranked
      JOIN profiles p ON p.id = ranked.follower_id
      WHERE ranked.rn <= ${MUTUALS_PER_PROFILE}
      ORDER BY ranked.followee_id, ranked.rn
    `),
  ]);

  for (const row of followerRows) {
    const context = contexts.get(row.id);
    if (context) context.followersCount = row.value;
  }
  for (const row of seenRows) {
    const context = contexts.get(row.id);
    if (context) context.seenCount = row.value;
  }
  for (const row of mutualResult.rows) {
    const context = contexts.get(row.followee_id);
    if (!context) continue;
    context.mutualFollowers.push({ id: row.follower_id, full_name: row.full_name });
    context.mutualFollowersCount = row.total;
  }
  return contexts;
}
