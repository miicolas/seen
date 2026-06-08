import { db } from "@seen/db";
import { mediaProviders, movies as moviesTable } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { env } from "../../env";
import { asDateString, asNumber, asRecord, asString } from "../../lib/coerce";
import { HttpError } from "../../lib/http-error";
import { redisGetJson, redisSetJson, withRedisLock } from "../../lib/redis";
import type { MovieDetailDto } from "./model";

// Shared TMDB HTTP + cache client used by the query endpoints. Holds the fetch,
// normalization, and movie-cache-warming primitives; the per-endpoint handlers
// live in ./queries.

const TMDB_BASE = "https://api.themoviedb.org/3";
export const DEFAULT_LANGUAGE = "fr-FR";
export const DEFAULT_REGION = "FR";
const HOT_TTL_SECONDS = 5 * 60;
export const DETAIL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const DETAIL_APPEND: Record<MediaType, string> = {
  movie: "credits,videos,images,release_dates,watch/providers",
  tv: "credits,videos,images,content_ratings,watch/providers",
};

const OFFER_TYPES = ["flatrate", "rent", "buy", "ads", "free"] as const;
type OfferType = (typeof OFFER_TYPES)[number];

export const MEDIA_GENRE_SHELVES = [
  { key: "Action", name: "Action", movieGenreId: 28, tvGenreId: 10759 },
  { key: "Comedy", name: "Comedy", movieGenreId: 35, tvGenreId: 35 },
  {
    key: "SciFiFantasy",
    name: "Sci-Fi & Fantasy",
    movieGenreId: 878,
    tvGenreId: 10765,
  },
] as const;

export type MediaType = "movie" | "tv";
export type MediaFilter = "all" | MediaType;

export interface RawTmdbItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
}

export interface TmdbMovieSummary {
  id: number;
  media_type: MediaType;
  title?: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  runtime?: number | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
}

export interface TmdbPagedResult {
  page: number;
  results: RawTmdbItem[];
  total_pages: number;
  total_results: number;
}

export interface GenreRow {
  key: (typeof MEDIA_GENRE_SHELVES)[number]["key"];
  name: string;
  media: TmdbMovieSummary[];
}

export interface DiscoverFeed {
  trending: TmdbMovieSummary[];
  topToday: TmdbMovieSummary[];
  newReleases: TmdbMovieSummary[];
  genres: GenreRow[];
}

type TmdbParams = Record<string, string | number | boolean | undefined>;

function tmdbAuthHeaders(): Record<string, string> {
  if (!env.tmdbToken) return { "Content-Type": "application/json;charset=utf-8" };
  return {
    Authorization: `Bearer ${env.tmdbToken}`,
    "Content-Type": "application/json;charset=utf-8",
  };
}

function cacheKey(path: string, params: TmdbParams) {
  const sorted = Object.entries(params)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `tmdb:${path}:${JSON.stringify(sorted)}`;
}

export async function tmdbFetch<T>(
  path: string,
  params: TmdbParams = {},
  ttlSeconds = HOT_TTL_SECONDS,
): Promise<T> {
  const normalizedParams = {
    language: DEFAULT_LANGUAGE,
    include_adult: false,
    ...params,
  };
  const key = cacheKey(path, normalizedParams);
  const cached = await redisGetJson<T>(key);
  if (cached) return cached;

  return withRedisLock(`lock:${key}`, 5_000, async () => {
    const lockedCached = await redisGetJson<T>(key);
    if (lockedCached) return lockedCached;

    const url = new URL(`${TMDB_BASE}${path}`);
    for (const [param, value] of Object.entries(normalizedParams)) {
      if (value !== undefined) url.searchParams.set(param, String(value));
    }

    const headers = tmdbAuthHeaders();
    if (!env.tmdbToken) {
      if (!env.tmdbApiKey) {
        throw new HttpError(500, "TMDB credentials are not configured");
      }
      url.searchParams.set("api_key", env.tmdbApiKey);
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      let message = response.statusText;
      let statusCode: number | undefined;
      try {
        const body = (await response.json()) as {
          status_message?: string;
          status_code?: number;
        };
        message = body.status_message ?? message;
        statusCode = body.status_code;
      } catch {
        message = response.statusText;
      }
      throw new HttpError(response.status, message, statusCode?.toString());
    }

    const data = (await response.json()) as T;
    await redisSetJson(key, data, ttlSeconds);
    return data;
  });
}

export function normalizeSummary(item: RawTmdbItem, fallbackType: MediaType): TmdbMovieSummary {
  const mediaType: MediaType =
    item.media_type === "tv" ? "tv" : item.media_type === "movie" ? "movie" : fallbackType;

  return {
    id: asNumber(item.id) ?? 0,
    media_type: mediaType,
    title: asString(item.title ?? item.name ?? item.original_title ?? item.original_name),
    original_title: asString(item.original_title ?? item.original_name),
    overview: asString(item.overview),
    release_date: asDateString(item.release_date ?? item.first_air_date),
    poster_path: item.poster_path ?? null,
    backdrop_path: item.backdrop_path ?? null,
    vote_average: asNumber(item.vote_average),
    vote_count: asNumber(item.vote_count),
    popularity: asNumber(item.popularity),
    genre_ids: Array.isArray(item.genre_ids)
      ? item.genre_ids.filter((id): id is number => typeof id === "number")
      : undefined,
  };
}

export function hasRating(item: TmdbMovieSummary) {
  return typeof item.vote_average === "number" && item.vote_average > 0;
}

function interleave(movies: TmdbMovieSummary[], series: TmdbMovieSummary[]): TmdbMovieSummary[] {
  const out: TmdbMovieSummary[] = [];
  const max = Math.max(movies.length, series.length);
  for (let index = 0; index < max; index += 1) {
    if (movies[index]) out.push(movies[index]);
    if (series[index]) out.push(series[index]);
  }
  return out;
}

export function combine(
  movies: TmdbMovieSummary[],
  series: TmdbMovieSummary[],
  filter: MediaFilter,
): TmdbMovieSummary[] {
  if (filter === "movie") return movies.filter(hasRating);
  if (filter === "tv") return series.filter(hasRating);
  return interleave(movies, series).filter(hasRating);
}

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

export async function discover(
  mediaType: MediaType,
  params: TmdbParams,
): Promise<TmdbMovieSummary[]> {
  const result = await tmdbFetch<TmdbPagedResult>(`/discover/${mediaType}`, params);
  const language = String(params.language ?? DEFAULT_LANGUAGE);
  const normalized = result.results.map((item) => normalizeSummary(item, mediaType));
  void upsertMovieList(normalized, language).catch((error) =>
    console.error("movie list cache warm failed", error),
  );
  return normalized;
}

export async function trending(
  filter: MediaFilter,
  timeWindow: "day" | "week",
  language = DEFAULT_LANGUAGE,
): Promise<TmdbMovieSummary[]> {
  const result = await tmdbFetch<TmdbPagedResult>(`/trending/${filter}/${timeWindow}`, {
    language,
  });
  const fallbackType: MediaType = filter === "tv" ? "tv" : "movie";
  const normalized = result.results
    .filter((item) => item.media_type !== "person")
    .map((item) => normalizeSummary(item, fallbackType));
  void upsertMovieList(normalized, language).catch((error) =>
    console.error("trending cache warm failed", error),
  );
  return normalized;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
