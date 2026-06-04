import i18n from "@/lib/i18n";
import type { MediaType, RawTmdbItem, TmdbMovieSummary } from "./types";

const TMDB_LOCALES: Record<string, string> = { en: "en-US", fr: "fr-FR" };

// Maps the app language onto a TMDB locale so movie titles, overviews and
// genres come back in the language the user is reading the app in.
export function tmdbLanguage(language = i18n.language): string {
  const lang = language?.split("-")[0] ?? "en";
  return TMDB_LOCALES[lang] ?? "en-US";
}

export function normalizeSummary(
  item: RawTmdbItem,
  fallbackType: MediaType,
): TmdbMovieSummary {
  const media_type: MediaType =
    item.media_type === "tv" ? "tv" : item.media_type === "movie" ? "movie" : fallbackType;
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
