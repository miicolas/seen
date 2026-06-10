import { db } from "@seen/db";
import { mediaProviders, providers as providersTable, userPlatforms } from "@seen/db/schema";
import { and, eq, inArray } from "@seen/db/orm";

import { byDisplayPriority } from "../../../lib/sort";
import { mediaKey } from "../../similarity/shared";

export type ProviderRef = { providerId: number; name: string; logoPath: string | null };

export async function getUserPlatformIds(userId: string, region: string): Promise<number[]> {
  const rows = await db
    .select({ providerId: userPlatforms.providerId })
    .from(userPlatforms)
    .where(and(eq(userPlatforms.userId, userId), eq(userPlatforms.region, region)));
  return rows.map((row) => row.providerId);
}

// Flatrate providers per candidate title in one region, keyed by mediaKey and
// sorted by display priority. Shared by the available and For You feeds.
export async function getProvidersForCandidates(
  refs: { tmdbId: number; mediaType: string }[],
  region: string,
): Promise<Map<string, ProviderRef[]>> {
  if (refs.length === 0) return new Map();
  const ids = [...new Set(refs.map((ref) => ref.tmdbId))];
  const rows = await db
    .select({
      tmdbId: mediaProviders.tmdbId,
      mediaType: mediaProviders.mediaType,
      providerId: mediaProviders.providerId,
      displayPriority: providersTable.displayPriority,
      name: providersTable.name,
      logoPath: providersTable.logoPath,
    })
    .from(mediaProviders)
    .innerJoin(providersTable, eq(providersTable.providerId, mediaProviders.providerId))
    .where(
      and(
        inArray(mediaProviders.tmdbId, ids),
        eq(mediaProviders.region, region),
        eq(mediaProviders.offerType, "flatrate"),
      ),
    );

  const grouped = new Map<string, (ProviderRef & { displayPriority: number | null })[]>();
  for (const row of rows) {
    const key = mediaKey(row.tmdbId, row.mediaType);
    const entry = {
      providerId: row.providerId,
      name: row.name,
      logoPath: row.logoPath ?? null,
      displayPriority: row.displayPriority,
    };
    const list = grouped.get(key);
    if (list) list.push(entry);
    else grouped.set(key, [entry]);
  }

  const byKey = new Map<string, ProviderRef[]>();
  for (const [key, list] of grouped) {
    byKey.set(
      key,
      list
        .sort(byDisplayPriority)
        .map(({ providerId, name, logoPath }) => ({ providerId, name, logoPath })),
    );
  }
  return byKey;
}
