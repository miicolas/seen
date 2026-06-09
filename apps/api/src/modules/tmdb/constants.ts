import type { MediaType } from "./types";

export const DEFAULT_LANGUAGE = "fr-FR";
export const DEFAULT_REGION = "FR";
export const HOT_TTL_SECONDS = 5 * 60;
export const DETAIL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const DETAIL_APPEND: Record<MediaType, string> = {
  movie: "credits,videos,images,release_dates,watch/providers,keywords",
  tv: "credits,videos,images,content_ratings,watch/providers,keywords",
};

export const OFFER_TYPES = ["flatrate", "rent", "buy", "ads", "free"] as const;

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

export function today() {
  return new Date().toISOString().slice(0, 10);
}
