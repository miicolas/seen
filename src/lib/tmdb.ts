// Client-side TMDB access for the app. Everything goes through the server-side
// `tmdb` Edge Function (token stays server-side, quota + cache centralized) —
// the app never calls api.themoviedb.org directly. See `.agents/skills/tmdb`.

import { supabase } from "@/lib/supabase";

/** Light movie shape returned by search/discover (mirrors the Edge Function). */
export interface TmdbMovieSummary {
  id: number;
  title?: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
}

interface TmdbPagedResult {
  page: number;
  results: TmdbMovieSummary[];
  total_pages: number;
  total_results: number;
}

type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original";
type BackdropSize = "w300" | "w780" | "w1280" | "original";

const IMAGE_BASE = "https://image.tmdb.org/t/p";

/**
 * Build a full TMDB image URL from a `poster_path` / `backdrop_path`.
 * Returns `undefined` when the path is missing so callers can fall back.
 */
export function tmdbImageUrl(
  path: string | null | undefined,
  size: PosterSize | BackdropSize = "w500",
): string | undefined {
  if (!path) return undefined;
  return `${IMAGE_BASE}/${size}${path}`;
}

/**
 * `/discover/movie` via the Edge Function. `params` are TMDB discover filters
 * (sort_by, vote_count.gte, primary_release_date.lte, …). Throws on failure.
 */
export async function discoverMovies(
  params: Record<string, string | number | boolean | undefined>,
  page = 1,
): Promise<TmdbMovieSummary[]> {
  const { data, error } = await supabase.functions.invoke<TmdbPagedResult>("tmdb", {
    body: { action: "discover", params, page },
  });

  if (error) throw error;
  return data?.results ?? [];
}
