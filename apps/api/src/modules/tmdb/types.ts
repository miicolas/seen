import type { MEDIA_GENRE_SHELVES } from "./constants";

export type MediaType = "movie" | "tv";
export type MediaFilter = "all" | MediaType;

export type TmdbParams = Record<string, string | number | boolean | undefined>;

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
