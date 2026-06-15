import { db } from "@seen/db";
import { sql } from "@seen/db/orm";

import type { RecommendationProfileCardDto } from "../model";

type FriendRow = {
  id: string;
  username: string;
  full_name: string;
  avatar_path: string | null;
};

// Candidate recipients = people the current user follows (one-directional, no
// mutual-follow requirement — unlike watch-session invites).
export async function listRecommendableFriends(
  userId: string,
): Promise<RecommendationProfileCardDto[]> {
  const result = await db.execute<FriendRow>(sql`
    SELECT p.id, p.username, p.full_name, p.avatar_path
    FROM follows f
    JOIN profiles p ON p.id = f.followee_id
    WHERE f.follower_id = ${userId}
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
