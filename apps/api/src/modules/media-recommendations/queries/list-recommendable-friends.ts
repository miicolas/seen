import { db } from "@seen/db";
import { sql } from "@seen/db/orm";

import type { RecommendationProfileCardDto } from "../model";

type FriendRow = {
  id: string;
  username: string;
  full_name: string;
  avatar_path: string | null;
};

// Candidate recipients = mutual follows only. Recommendations are a friend-to-
// friend action, not a broadcast to every profile the sender follows.
export async function listRecommendableFriends(
  userId: string,
): Promise<RecommendationProfileCardDto[]> {
  const result = await db.execute<FriendRow>(sql`
    SELECT p.id, p.username, p.full_name, p.avatar_path
    FROM follows f1
    JOIN follows f2 ON f2.follower_id = f1.followee_id AND f2.followee_id = f1.follower_id
    JOIN profiles p ON p.id = f1.followee_id
    WHERE f1.follower_id = ${userId}
    ORDER BY p.full_name
    LIMIT 100
  `);

  return result.rows.map((row) => ({
    user_id: row.id,
    username: row.username,
    full_name: row.full_name,
    avatar_path: row.avatar_path,
  }));
}
