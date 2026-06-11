import { db } from "@seen/db";
import { sql } from "@seen/db/orm";

import { loadSessionWithParticipant, type ProfileCardDto } from "../shared";

type FriendRow = {
  id: string;
  username: string;
  full_name: string;
  avatar_path: string | null;
};

export async function listInvitableFriends(
  userId: string,
  sessionId: string,
): Promise<ProfileCardDto[]> {
  await loadSessionWithParticipant(sessionId, userId);

  const result = await db.execute<FriendRow>(sql`
    SELECT p.id, p.username, p.full_name, p.avatar_path
    FROM follows f1
    JOIN follows f2 ON f2.follower_id = f1.followee_id AND f2.followee_id = f1.follower_id
    JOIN profiles p ON p.id = f1.followee_id
    WHERE f1.follower_id = ${userId}
      AND NOT EXISTS (
        SELECT 1 FROM watch_session_participants wp
        WHERE wp.session_id = ${sessionId} AND wp.user_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM watch_session_invitations wi
        WHERE wi.session_id = ${sessionId}
          AND wi.invitee_id = p.id
          AND (
            wi.status = 'accepted'
            OR (wi.status = 'pending' AND wi.expires_at > now())
          )
      )
    ORDER BY p.full_name
    LIMIT 50
  `);

  return result.rows.map((row) => ({
    user_id: row.id,
    username: row.username,
    full_name: row.full_name,
    avatar_path: row.avatar_path,
  }));
}
