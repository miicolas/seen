import { asDateString, asNumber, asString } from "../../lib/coerce";
import type { MediaFilter, MediaType, RawTmdbItem, TmdbMovieSummary } from "./types";

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
