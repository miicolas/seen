import { db } from "@seen/db";
import { providers as providersTable } from "@seen/db/schema";
import { sql } from "@seen/db/orm";

import { asNumber, asRecord, asString } from "../../../lib/coerce";
import { tmdbFetch } from "../../tmdb/client";
import type { ProviderRefDto } from "../model";

type TmdbProvider = {
  provider_id?: unknown;
  provider_name?: unknown;
  logo_path?: unknown;
  display_priority?: unknown;
};

type TmdbProvidersResponse = {
  results?: TmdbProvider[];
};

async function fetchCatalog(mediaType: "movie" | "tv", region: string): Promise<TmdbProvider[]> {
  const res = await tmdbFetch<TmdbProvidersResponse>(
    `/watch/providers/${mediaType}`,
    { watch_region: region },
    60 * 60,
  );
  return Array.isArray(res.results) ? res.results : [];
}

async function warmProviders(rows: ProviderRefDto[], priorities: Map<number, number>) {
  if (rows.length === 0) return;
  await db
    .insert(providersTable)
    .values(
      rows.map((row) => ({
        providerId: row.providerId,
        name: row.name,
        logoPath: row.logoPath ?? null,
        displayPriority: priorities.get(row.providerId) ?? null,
      })),
    )
    .onConflictDoUpdate({
      target: providersTable.providerId,
      set: {
        name: sql`excluded.name`,
        logoPath: sql`excluded.logo_path`,
        displayPriority: sql`excluded.display_priority`,
        updatedAt: new Date(),
      },
    });
}

export async function listProviders(region: string): Promise<ProviderRefDto[]> {
  const [movies, series] = await Promise.all([
    fetchCatalog("movie", region),
    fetchCatalog("tv", region),
  ]);

  const dedup = new Map<number, ProviderRefDto>();
  const priorities = new Map<number, number>();

  for (const entry of [...movies, ...series]) {
    const record = asRecord(entry);
    const providerId = asNumber(record.provider_id);
    const name = asString(record.provider_name);
    if (providerId === undefined || !name) continue;
    if (!dedup.has(providerId)) {
      dedup.set(providerId, {
        providerId,
        name,
        logoPath: asString(record.logo_path) ?? null,
      });
    }
    const priority = asNumber(record.display_priority);
    if (priority !== undefined) {
      const current = priorities.get(providerId);
      if (current === undefined || priority < current) priorities.set(providerId, priority);
    }
  }

  const list = [...dedup.values()].sort((a, b) => {
    const pa = priorities.get(a.providerId) ?? 9999;
    const pb = priorities.get(b.providerId) ?? 9999;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  // Await the warm so the `providers` table is authoritative before the client
  // can POST a selection back: setUserPlatforms validates provider ids against
  // this table, so a fire-and-forget warm would let a fast save silently drop
  // every selection on a cold catalog.
  try {
    await warmProviders(list, priorities);
  } catch (error) {
    console.error("provider catalog warm failed", error);
  }

  return list;
}
