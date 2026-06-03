export type MediaType = "movie" | "tv";

export type MediaFilter = "all" | MediaType;

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

export interface TmdbMovieDetail extends TmdbMovieSummary {
  runtime?: number;
  genres?: { id: number; name: string }[];
  _cache?: "hit" | "miss";
  [key: string]: unknown;
}

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

export interface TmdbPagedResult {
  page: number;
  results: RawTmdbItem[];
  total_pages: number;
  total_results: number;
}

export interface TmdbFindResult {
  movie_results?: RawTmdbItem[];
  tv_results?: RawTmdbItem[];
  [key: string]: unknown;
}
