import { db } from "@seen/db";
import { mediaRecommendations, profiles } from "@seen/db/schema";
import { desc, eq } from "@seen/db/orm";

import type { ReceivedRecommendationDto } from "../model";

export async function listReceived(userId: string): Promise<ReceivedRecommendationDto[]> {
  const rows = await db
    .select({
      id: mediaRecommendations.id,
      tmdbId: mediaRecommendations.tmdbId,
      mediaType: mediaRecommendations.mediaType,
      title: mediaRecommendations.title,
      posterPath: mediaRecommendations.posterPath,
      message: mediaRecommendations.message,
      readAt: mediaRecommendations.readAt,
      createdAt: mediaRecommendations.createdAt,
      senderId: profiles.id,
      username: profiles.username,
      fullName: profiles.fullName,
      avatarPath: profiles.avatarPath,
    })
    .from(mediaRecommendations)
    .innerJoin(profiles, eq(profiles.id, mediaRecommendations.senderId))
    .where(eq(mediaRecommendations.recipientId, userId))
    .orderBy(desc(mediaRecommendations.createdAt))
    .limit(100);

  return rows.map((row) => ({
    id: row.id,
    tmdb_id: row.tmdbId,
    media_type: row.mediaType,
    title: row.title,
    poster_path: row.posterPath,
    message: row.message,
    read_at: row.readAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    sender: {
      user_id: row.senderId,
      username: row.username,
      full_name: row.fullName,
      avatar_path: row.avatarPath,
    },
  }));
}
