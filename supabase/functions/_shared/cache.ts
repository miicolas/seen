import { getAdminClient } from "./supabase-admin.ts";
import type {
  TmdbMediaType,
  TmdbMovieDetail,
  TmdbMovieSummary,
} from "./tmdb.ts";

export const DETAIL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CachedMovieRow {
  tmdb_id: number;
  detail: TmdbMovieDetail | null;
  detail_fetched_at: string | null;
  language: string | null;
}

export async function getCachedMovieDetail(
  tmdbId: number,
  mediaType: TmdbMediaType = "movie",
  language?: string,
  ttlMs = DETAIL_TTL_MS,
): Promise<TmdbMovieDetail | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("movies")
    .select("tmdb_id, detail, detail_fetched_at, language")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle<CachedMovieRow>();

  if (error) throw error;
  if (!data?.detail || !data.detail_fetched_at) return null;
  // The cache holds one language per movie; a different language is a miss so
  // we refetch (and overwrite) in the language the user is now reading in.
  if (language && data.language && data.language !== language) return null;

  const age = Date.now() - new Date(data.detail_fetched_at).getTime();
  if (age > ttlMs) return null;

  return data.detail;
}

function summaryRow(m: TmdbMovieSummary, defaultMediaType: TmdbMediaType) {
  return {
    tmdb_id: m.id,
    media_type: m.media_type ?? defaultMediaType,
    title: m.title ?? m.name ?? m.original_title ?? m.original_name ?? "",
    original_title: m.original_title ?? m.original_name ?? null,
    overview: m.overview ?? null,
    release_date: m.release_date || m.first_air_date || null,
    poster_path: m.poster_path ?? null,
    backdrop_path: m.backdrop_path ?? null,
    vote_average: m.vote_average ?? null,
    vote_count: m.vote_count ?? null,
    popularity: m.popularity ?? null,
  };
}

export async function upsertMovieDetail(
  detail: TmdbMovieDetail,
  language: string,
  mediaType: TmdbMediaType = "movie",
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from("movies").upsert(
    {
      ...summaryRow(detail, mediaType),
      runtime: detail.runtime ?? null,
      genres: detail.genres ?? null,
      language,
      detail,
      detail_fetched_at: new Date().toISOString(),
    },
    { onConflict: "tmdb_id,media_type" },
  );
  if (error) throw error;
}

export async function upsertMovieList(
  results: TmdbMovieSummary[],
  language: string,
  defaultMediaType: TmdbMediaType = "movie",
): Promise<void> {
  if (!results.length) return;
  const supabase = getAdminClient();
  const rows = results.map((m) => ({
    ...summaryRow(m, defaultMediaType),
    language,
  }));
  const { error } = await supabase
    .from("movies")
    .upsert(rows, { onConflict: "tmdb_id,media_type" });
  if (error) throw error;
}
