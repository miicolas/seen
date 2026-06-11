import { db } from "@seen/db";
import { profiles, reviews, watchlist } from "@seen/db/schema";
import { and, inArray } from "@seen/db/orm";

import type { MediaType } from "../../tmdb";
import { listFriendsWatchRows } from "../../watch-sessions/queries/list-friends-watch-rows";

// Reuse the social module's follow lookup rather than duplicating the query.
export { getFolloweeIds } from "../../social/activity";

type CandidateRef = { id: number; media_type: MediaType };
export type SignalAction = "review" | "watched" | "watchlist";

export type FriendSignal = { count: number; reason: string | null };

const ACTION_PRIORITY: SignalAction[] = ["review", "watched", "watchlist"];

const SINGLE_REASONS: Record<SignalAction, (username: string) => string> = {
  review: (username) => `@${username} reviewed this`,
  watched: (username) => `@${username} watched this`,
  watchlist: (username) => `@${username} added this to their watchlist`,
};

export function buildReason(entries: { username: string; action: SignalAction }[]): string | null {
  const primary =
    ACTION_PRIORITY.map((action) => entries.find((entry) => entry.action === action)).find(
      Boolean,
    ) ?? entries[0];
  if (!primary) return null;
  if (entries.length === 1) return SINGLE_REASONS[primary.action](primary.username);
  const others = entries.length - 1;
  return `@${primary.username} and ${others} other${others > 1 ? "s" : ""}`;
}

// For each candidate, how many of the user's followees engaged with it (reviewed
// or kept a non-private watchlist entry) plus a short reason. As a follower the
// viewer can see followers/public content, so only `private` watchlist rows are
// excluded — never a leak of hidden activity.
export async function computeFriendSignals(
  followeeIds: string[],
  candidates: CandidateRef[],
): Promise<Map<string, FriendSignal>> {
  const result = new Map<string, FriendSignal>();
  if (followeeIds.length === 0 || candidates.length === 0) return result;

  const tmdbIds = [...new Set(candidates.map((candidate) => candidate.id))];
  const candidateKeys = new Set(
    candidates.map((candidate) => `${candidate.media_type}:${candidate.id}`),
  );

  const [reviewRows, watchlistRows, sessionRows] = await Promise.all([
    db
      .select({ userId: reviews.userId, tmdbId: reviews.tmdbId, mediaType: reviews.mediaType })
      .from(reviews)
      .where(and(inArray(reviews.userId, followeeIds), inArray(reviews.tmdbId, tmdbIds))),
    db
      .select({
        userId: watchlist.userId,
        tmdbId: watchlist.tmdbId,
        mediaType: watchlist.mediaType,
      })
      .from(watchlist)
      .where(
        and(
          inArray(watchlist.userId, followeeIds),
          inArray(watchlist.tmdbId, tmdbIds),
          inArray(watchlist.visibility, ["followers", "public"]),
        ),
      ),
    listFriendsWatchRows(followeeIds),
  ]);

  const byKey = new Map<string, Map<string, SignalAction>>();
  const record = (key: string, userId: string, action: SignalAction) => {
    if (!candidateKeys.has(key)) return;
    let users = byKey.get(key);
    if (!users) {
      users = new Map();
      byKey.set(key, users);
    }
    const current = users.get(userId);
    if (!current || ACTION_PRIORITY.indexOf(action) < ACTION_PRIORITY.indexOf(current)) {
      users.set(userId, action);
    }
  };
  for (const row of reviewRows) record(`${row.mediaType}:${row.tmdbId}`, row.userId, "review");
  for (const row of watchlistRows)
    record(`${row.mediaType}:${row.tmdbId}`, row.userId, "watchlist");
  for (const row of sessionRows) {
    for (const watcherId of row.watcherIds) {
      record(`${row.mediaType}:${row.tmdbId}`, watcherId, "watched");
    }
  }

  const userIds = new Set<string>();
  for (const users of byKey.values()) for (const id of users.keys()) userIds.add(id);
  const nameRows = userIds.size
    ? await db
        .select({ id: profiles.id, username: profiles.username })
        .from(profiles)
        .where(inArray(profiles.id, [...userIds]))
    : [];
  const usernames = new Map(nameRows.map((row) => [row.id, row.username]));

  for (const [key, users] of byKey) {
    const entries = [...users.entries()]
      .map(([id, action]) => ({ username: usernames.get(id) ?? "someone", action }))
      .sort((left, right) => left.username.localeCompare(right.username));
    result.set(key, { count: entries.length, reason: buildReason(entries) });
  }
  return result;
}
