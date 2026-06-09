import { db } from "@seen/db";
import { mediaProviders, providers as providersTable } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { byDisplayPriority } from "../../../lib/sort";

import { tmdbFetch } from "../client";
import { DEFAULT_LANGUAGE, DETAIL_APPEND, DETAIL_TTL_MS } from "../constants";
import { upsertMovieDetail } from "../persist";
import type { MediaType } from "../types";
import { toMovieDetail, toWatchProviders, type WatchProvidersResource } from "../resources";

async function readFromCache(
  mediaType: MediaType,
  tmdbId: number,
  region: string,
): Promise<WatchProvidersResource | null> {
  const rows = await db
    .select({
      providerId: mediaProviders.providerId,
      offerType: mediaProviders.offerType,
      updatedAt: mediaProviders.updatedAt,
      name: providersTable.name,
      logoPath: providersTable.logoPath,
      displayPriority: providersTable.displayPriority,
    })
    .from(mediaProviders)
    .innerJoin(providersTable, eq(providersTable.providerId, mediaProviders.providerId))
    .where(
      and(
        eq(mediaProviders.tmdbId, tmdbId),
        eq(mediaProviders.mediaType, mediaType),
        eq(mediaProviders.region, region),
      ),
    );

  if (rows.length === 0) return null;

  const freshest = rows.reduce(
    (max, row) => (row.updatedAt.getTime() > max ? row.updatedAt.getTime() : max),
    0,
  );
  if (Date.now() - freshest > DETAIL_TTL_MS) return null;

  const dto: WatchProvidersResource = { region, link: null, flatrate: [], rent: [], buy: [] };
  const sorted = [...rows].sort(byDisplayPriority);
  for (const row of sorted) {
    if (row.offerType !== "flatrate" && row.offerType !== "rent" && row.offerType !== "buy") {
      continue;
    }
    const ref = { providerId: row.providerId, name: row.name, logoPath: row.logoPath ?? null };
    dto[row.offerType].push(ref);
  }
  return dto;
}

export async function getWatchProviders(
  mediaType: MediaType,
  tmdbId: number,
  region: string,
  language = DEFAULT_LANGUAGE,
): Promise<WatchProvidersResource> {
  const cached = await readFromCache(mediaType, tmdbId, region);
  if (cached) return cached;

  const raw = await tmdbFetch<Record<string, unknown>>(
    `/${mediaType}/${tmdbId}`,
    {
      language,
      append_to_response: DETAIL_APPEND[mediaType],
    },
    60 * 60,
  );
  const dto = toMovieDetail(raw, mediaType, "miss");
  await upsertMovieDetail(dto, raw, language);
  return toWatchProviders(raw, region);
}
