import type { MovieDetailDto } from "../../tmdb/model";
import type { TmdbMovieSummary } from "../../tmdb/types";
import type { SeedItemDto } from "../model";

export function toSeedItem(source: TmdbMovieSummary | MovieDetailDto): SeedItemDto {
  return {
    id: source.id,
    media_type: source.media_type,
    title: source.title,
    original_title: source.original_title,
    overview: source.overview,
    release_date: source.release_date,
    poster_path: source.poster_path ?? null,
    backdrop_path: source.backdrop_path ?? null,
    vote_average: source.vote_average,
    genre_ids:
      source.genre_ids ??
      ("genres" in source ? source.genres?.map((genre) => genre.id) : undefined),
  };
}
