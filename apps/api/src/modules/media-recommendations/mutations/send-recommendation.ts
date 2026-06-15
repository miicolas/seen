import { db } from "@seen/db";
import { follows, mediaRecommendations } from "@seen/db/schema";
import { and, eq, inArray } from "@seen/db/orm";

import { notifyRecommendation } from "../notify";

type SendInput = {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path?: string | null;
  recipient_ids: string[];
  message?: string | null;
};

export async function sendRecommendation(
  senderId: string,
  input: SendInput,
): Promise<{ ok: boolean; count: number }> {
  const requested = [...new Set(input.recipient_ids)].filter((id) => id !== senderId);
  if (requested.length === 0) return { ok: true, count: 0 };

  // Recipients must be people the sender follows (one-directional).
  const following = await db
    .select({ id: follows.followeeId })
    .from(follows)
    .where(and(eq(follows.followerId, senderId), inArray(follows.followeeId, requested)));
  const recipientIds = following.map((row) => row.id);
  if (recipientIds.length === 0) return { ok: true, count: 0 };

  const rows = await db
    .insert(mediaRecommendations)
    .values(
      recipientIds.map((recipientId) => ({
        senderId,
        recipientId,
        tmdbId: input.tmdb_id,
        mediaType: input.media_type,
        title: input.title,
        posterPath: input.poster_path ?? null,
        message: input.message ?? null,
      })),
    )
    .returning({ id: mediaRecommendations.id, recipientId: mediaRecommendations.recipientId });

  for (const row of rows) {
    void notifyRecommendation({
      recommendationId: row.id,
      recipientUserId: row.recipientId,
      actorId: senderId,
      title: input.title,
    });
  }

  return { ok: true, count: rows.length };
}
