// Cache helpers over the `movies` table. Details are cache-aside; list results
// only warm the cache with "light" rows (no detail_fetched_at).

import { getAdminClient } from "./supabase-admin.ts";
import type {
  TmdbMovieDetail,
  TmdbMovieSummary,
} from "./tmdb.ts";

// How long a cached detail stays fresh before we re-fetch from TMDB (~30 days).
export const DETAIL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CachedMovieRow {
  tmdb_id: number;
  detail: TmdbMovieDetail | null;
  detail_fetched_at: string | null;
}

/** Returns the cached detail when present and still fresh, else null. */
export async function getCachedMovieDetail(
  tmdbId: number,
  ttlMs = DETAIL_TTL_MS,
): Promise<TmdbMovieDetail | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("movies")
    .select("tmdb_id, detail, detail_fetched_at")
    .eq("tmdb_id", tmdbId)
    .maybeSingle<CachedMovieRow>();

  if (error) throw error;
  if (!data?.detail || !data.detail_fetched_at) return null;

  const age = Date.now() - new Date(data.detail_fetched_at).getTime();
  if (age > ttlMs) return null;

  return data.detail;
}

function summaryRow(m: TmdbMovieSummary) {
  return {
    tmdb_id: m.id,
    title: m.title ?? m.original_title ?? "",
    original_title: m.original_title ?? null,
    overview: m.overview ?? null,
    release_date: m.release_date || null,
    poster_path: m.poster_path ?? null,
    backdrop_path: m.backdrop_path ?? null,
    vote_average: m.vote_average ?? null,
    vote_count: m.vote_count ?? null,
    popularity: m.popularity ?? null,
  };
}

/** Upsert the full detail payload and stamp detail_fetched_at. */
export async function upsertMovieDetail(
  detail: TmdbMovieDetail,
  language: string,
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from("movies").upsert(
    {
      ...summaryRow(detail),
      runtime: detail.runtime ?? null,
      genres: detail.genres ?? null,
      language,
      detail,
      detail_fetched_at: new Date().toISOString(),
    },
    { onConflict: "tmdb_id" },
  );
  if (error) throw error;
}

/**
 * Warm the cache with light rows from a list response. Does NOT touch
 * `detail`/`detail_fetched_at`, so it never overwrites a full detail.
 */
export async function upsertMovieList(
  results: TmdbMovieSummary[],
  language: string,
): Promise<void> {
  if (!results.length) return;
  const supabase = getAdminClient();
  const rows = results.map((m) => ({ ...summaryRow(m), language }));
  const { error } = await supabase
    .from("movies")
    .upsert(rows, { onConflict: "tmdb_id" });
  if (error) throw error;
}
