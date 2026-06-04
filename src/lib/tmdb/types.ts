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
  number_of_seasons?: number;
  seasons?: TmdbTvSeasonSummary[];
  _cache?: "hit" | "miss";
  [key: string]: unknown;
}

export interface TmdbCredit {
  id: number;
  name: string;
  original_name?: string;
  character?: string;
  job?: string;
  department?: string;
  profile_path?: string | null;
}

export interface TmdbTvSeasonSummary {
  id: number;
  name?: string;
  overview?: string;
  air_date?: string;
  episode_count?: number;
  poster_path?: string | null;
  season_number: number;
  vote_average?: number;
}

export interface TmdbTvEpisodeSummary {
  id: number;
  air_date?: string;
  episode_number: number;
  episode_type?: string;
  name?: string;
  overview?: string;
  production_code?: string;
  runtime?: number;
  season_number: number;
  show_id?: number;
  still_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  crew?: TmdbCredit[];
  guest_stars?: TmdbCredit[];
}

export interface TmdbTvSeasonDetail extends TmdbTvSeasonSummary {
  episodes?: TmdbTvEpisodeSummary[];
}

export interface TmdbTvEpisodeDetail extends TmdbTvEpisodeSummary {
  credits?: {
    cast?: TmdbCredit[];
    crew?: TmdbCredit[];
    guest_stars?: TmdbCredit[];
  };
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
