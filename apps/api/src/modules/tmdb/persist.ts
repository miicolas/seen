import { db } from "@seen/db";
import { mediaProviders, movies as moviesTable } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { asNumber, asRecord } from "../../lib/coerce";
import { OFFER_TYPES } from "./constants";
import type { MovieDetailDto } from "./model";
import type { MediaType, TmdbMovieSummary } from "./types";

function movieSummaryValues(summary: TmdbMovieSummary, language: string) {
  return {
    tmdbId: summary.id,
    mediaType: summary.media_type,
    title: summary.title ?? "",
    originalTitle: summary.original_title ?? null,
    overview: summary.overview ?? null,
    releaseDate: summary.release_date || null,
    posterPath: summary.poster_path ?? null,
    backdropPath: summary.backdrop_path ?? null,
    voteAverage: summary.vote_average ?? null,
    voteCount: summary.vote_count ?? null,
    popularity: summary.popularity ?? null,
    genres: summary.genre_ids ?? null,
    language,
  };
}

export async function upsertMovieList(
  summaries: TmdbMovieSummary[],
  language: string,
): Promise<void> {
  if (!summaries.length) return;

  await Promise.all(
    summaries.map((summary) => {
      const values = movieSummaryValues(summary, language);
      return db
        .insert(moviesTable)
        .values(values)
        .onConflictDoUpdate({
          target: [moviesTable.tmdbId, moviesTable.mediaType],
          set: values,
        });
    }),
  );
}

export async function upsertMovieDetail(
  detail: MovieDetailDto,
  raw: Record<string, unknown>,
  language: string,
): Promise<void> {
  const values = {
    ...movieSummaryValues(detail, language),
    runtime: detail.runtime ?? null,
    // Store genre ids only (named genres live in `detail`); the `genres` column
    // is the summary's `genre_ids` and must stay a number[].
    genres: detail.genres?.map((genre) => genre.id) ?? null,
    detail,
    detailFetchedAt: new Date(),
  };

  await db
    .insert(moviesTable)
    .values(values)
    .onConflictDoUpdate({
      target: [moviesTable.tmdbId, moviesTable.mediaType],
      set: values,
    });

  void upsertMediaProvidersFromDetail(detail.id, detail.media_type, raw).catch((error) =>
    console.error("media providers cache warm failed", error),
  );
}

type WatchProvidersByRegion = Record<string, Record<string, unknown>>;

function readRegionResults(detail: Record<string, unknown>): WatchProvidersByRegion {
  const providers = asRecord(detail["watch/providers"]);
  const results = asRecord(providers.results);
  return results as WatchProvidersByRegion;
}

export async function upsertMediaProvidersFromDetail(
  tmdbId: number,
  mediaType: MediaType,
  detail: Record<string, unknown>,
): Promise<void> {
  const results = readRegionResults(detail);
  const regions = Object.keys(results);
  if (regions.length === 0) return;

  const rows: (typeof mediaProviders.$inferInsert)[] = [];
  for (const region of regions) {
    const regionEntry = asRecord(results[region]);
    for (const offerType of OFFER_TYPES) {
      const offers = regionEntry[offerType];
      if (!Array.isArray(offers)) continue;
      for (const offer of offers) {
        const providerId = asNumber(asRecord(offer).provider_id);
        if (providerId === undefined) continue;
        rows.push({
          tmdbId,
          mediaType,
          region,
          providerId,
          offerType,
          updatedAt: new Date(),
        });
      }
    }
  }

  // Authoritatively replace this title's cached availability: the detail
  // response carries every region/offer, so delete-then-insert prunes providers
  // that dropped the title. A plain upsert would leave stale rows forever, since
  // cache freshness uses the newest row and removed offers are never refreshed.
  await db.transaction(async (tx) => {
    await tx
      .delete(mediaProviders)
      .where(and(eq(mediaProviders.tmdbId, tmdbId), eq(mediaProviders.mediaType, mediaType)));
    if (rows.length === 0) return;
    await tx.insert(mediaProviders).values(rows).onConflictDoNothing();
  });
}
