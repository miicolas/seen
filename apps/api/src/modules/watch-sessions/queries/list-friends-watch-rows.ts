import { db } from "@seen/db";
import { watchSessionParticipants, watchSessions } from "@seen/db/schema";
import { and, eq, gte, inArray } from "@seen/db/orm";

const WINDOW_DAYS = 30;

export type FriendWatchRow = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  watcherIds: string[];
  lastWatchedAt: Date;
};

export async function listFriendsWatchRows(
  followeeIds: string[],
  windowDays = WINDOW_DAYS,
): Promise<FriendWatchRow[]> {
  if (followeeIds.length === 0) return [];
  const since = new Date(Date.now() - windowDays * 24 * 3600_000);

  const rows = await db
    .select({
      tmdbId: watchSessions.tmdbId,
      mediaType: watchSessions.mediaType,
      userId: watchSessionParticipants.userId,
      completedAt: watchSessionParticipants.completedAt,
    })
    .from(watchSessionParticipants)
    .innerJoin(watchSessions, eq(watchSessions.id, watchSessionParticipants.sessionId))
    .where(
      and(
        inArray(watchSessionParticipants.userId, followeeIds),
        eq(watchSessionParticipants.status, "completed"),
        gte(watchSessionParticipants.completedAt, since),
      ),
    );

  const byMedia = new Map<
    string,
    { tmdbId: number; mediaType: "movie" | "tv"; watcherIds: Set<string>; lastWatchedAt: Date }
  >();
  for (const row of rows) {
    const mediaType = row.mediaType === "movie" ? "movie" : "tv";
    const key = `${mediaType}:${row.tmdbId}`;
    const completedAt = row.completedAt ?? new Date(0);
    let entry = byMedia.get(key);
    if (!entry) {
      entry = { tmdbId: row.tmdbId, mediaType, watcherIds: new Set(), lastWatchedAt: completedAt };
      byMedia.set(key, entry);
    }
    entry.watcherIds.add(row.userId);
    if (completedAt > entry.lastWatchedAt) entry.lastWatchedAt = completedAt;
  }
  return [...byMedia.values()]
    .map((entry) => ({ ...entry, watcherIds: [...entry.watcherIds] }))
    .sort((left, right) => right.lastWatchedAt.getTime() - left.lastWatchedAt.getTime());
}
