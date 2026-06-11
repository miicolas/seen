import { db } from "@seen/db";
import { movies as moviesTable, profiles } from "@seen/db/schema";
import { inArray } from "@seen/db/orm";

import { normalizeSummary } from "../../tmdb/normalize";
import { mediaKey } from "../../similarity/shared";
import { listFriendsWatchRows } from "../../watch-sessions/queries/list-friends-watch-rows";
import type { FriendsWatchedEntryDto } from "../model";
import { passesQualityGate } from "../quality-gate";
import { buildReason } from "./friend-signal";
import { getFolloweeIds } from "./friend-signal";
import { movieRowToSummary } from "./movie-row";

const MAX_ENTRIES = 15;

export async function getFriendsRecentlyWatched(userId: string): Promise<FriendsWatchedEntryDto[]> {
  const followeeIds = await getFolloweeIds(userId);
  const watchRows = await listFriendsWatchRows(followeeIds);
  if (watchRows.length === 0) return [];

  const watcherIds = [...new Set(watchRows.flatMap((row) => row.watcherIds))];
  const [movieRows, nameRows] = await Promise.all([
    db
      .select()
      .from(moviesTable)
      .where(inArray(moviesTable.tmdbId, [...new Set(watchRows.map((row) => row.tmdbId))])),
    db
      .select({ id: profiles.id, username: profiles.username })
      .from(profiles)
      .where(inArray(profiles.id, watcherIds)),
  ]);
  const moviesByKey = new Map(movieRows.map((row) => [mediaKey(row.tmdbId, row.mediaType), row]));
  const usernames = new Map(nameRows.map((row) => [row.id, row.username]));

  const entries: FriendsWatchedEntryDto[] = [];
  for (const row of watchRows) {
    const movie = moviesByKey.get(mediaKey(row.tmdbId, row.mediaType));
    if (!movie || !passesQualityGate(movie)) continue;
    const watchers = row.watcherIds
      .map((id) => ({ username: usernames.get(id) ?? "someone", action: "watched" as const }))
      .sort((left, right) => left.username.localeCompare(right.username));
    const summary = movieRowToSummary(movie);
    entries.push({
      ...normalizeSummary(summary, summary.media_type),
      friendCount: watchers.length,
      friendReason: buildReason(watchers),
    });
    if (entries.length >= MAX_ENTRIES) break;
  }
  return entries;
}
