// Client-side TMDB access for the app. Everything goes through the server-side
// `tmdb` Edge Function (token stays server-side, quota + cache centralized) —
// the app never calls api.themoviedb.org directly. See `.agents/skills/tmdb`.

import { supabase } from "@/lib/supabase";

export type MediaType = "movie" | "tv";

/**
 * Light media shape returned by search/discover/trending. Movies and TV series
 * are normalized into one shape: TV's `name`/`first_air_date` are mapped onto
 * `title`/`release_date` (see `normalizeSummary`) so cards stay media-agnostic.
 * `media_type` is always set so callers can tell them apart.
 */
export interface TmdbMovieSummary {
  id: number;
  media_type: MediaType;
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

/** Raw TMDB item as it comes back from the Edge Function (pre-normalization). */
interface RawTmdbItem {
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

interface TmdbPagedResult {
  page: number;
  results: RawTmdbItem[];
  total_pages: number;
  total_results: number;
}

/**
 * Fold a raw TMDB item (movie or tv) into the normalized summary. `fallbackType`
 * is used when the item doesn't tag itself (discover/tv responses don't, only
 * /trending/all does).
 */
function normalizeSummary(
  item: RawTmdbItem,
  fallbackType: MediaType,
): TmdbMovieSummary {
  const media_type: MediaType = item.media_type === "tv" ? "tv" : item.media_type === "movie" ? "movie" : fallbackType;
  return {
    id: item.id,
    media_type,
    title: item.title ?? item.name ?? item.original_title ?? item.original_name,
    original_title: item.original_title ?? item.original_name,
    overview: item.overview,
    release_date: item.release_date ?? item.first_air_date,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    vote_count: item.vote_count,
    popularity: item.popularity,
    genre_ids: item.genre_ids,
  };
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
 * `/discover/{movie|tv}` via the Edge Function. `params` are TMDB discover
 * filters (sort_by, vote_count.gte, with_genres, …). Results are normalized to
 * the shared media shape. Throws on failure.
 */
export async function discoverMedia(
  mediaType: MediaType,
  params: Record<string, string | number | boolean | undefined>,
  page = 1,
): Promise<TmdbMovieSummary[]> {
  const { data, error } = await supabase.functions.invoke<TmdbPagedResult>("tmdb", {
    body: { action: "discover", media_type: mediaType, params, page },
  });

  if (error) throw error;
  return (data?.results ?? []).map((item) => normalizeSummary(item, mediaType));
}

/** Convenience wrapper: `/discover/movie`. */
export function discoverMovies(
  params: Record<string, string | number | boolean | undefined>,
  page = 1,
): Promise<TmdbMovieSummary[]> {
  return discoverMedia("movie", params, page);
}

/** Convenience wrapper: `/discover/tv`. */
export function discoverTv(
  params: Record<string, string | number | boolean | undefined>,
  page = 1,
): Promise<TmdbMovieSummary[]> {
  return discoverMedia("tv", params, page);
}

/**
 * `/trending/{media_type}/{time_window}` via the Edge Function. Defaults to the
 * mixed "all" feed (movies + series in one list, Netflix-style). Each item is
 * normalized and keeps its own `media_type`.
 */
export async function trendingMedia(
  mediaType: "all" | MediaType = "all",
  timeWindow: "day" | "week" = "week",
): Promise<TmdbMovieSummary[]> {
  const { data, error } = await supabase.functions.invoke<TmdbPagedResult>("tmdb", {
    body: { action: "trending", media_type: mediaType, time_window: timeWindow },
  });

  if (error) throw error;
  // For the mixed feed each item tags itself; "movie" is only a fallback.
  const fallback: MediaType = mediaType === "tv" ? "tv" : "movie";
  return (data?.results ?? []).map((item) => normalizeSummary(item, fallback));
}
