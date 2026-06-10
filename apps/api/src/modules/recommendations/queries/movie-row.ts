import { asMediaType } from "@seen/shared";
import type { movies as moviesTable } from "@seen/db/schema";

import type { TmdbMovieSummary } from "../../tmdb";

// A `movies` cache row as the TMDB summary shape the feed DTOs are built from.
export function movieRowToSummary(movie: typeof moviesTable.$inferSelect): TmdbMovieSummary {
  return {
    id: movie.tmdbId,
    media_type: asMediaType(movie.mediaType),
    title: movie.title ?? undefined,
    original_title: movie.originalTitle ?? undefined,
    overview: movie.overview ?? undefined,
    release_date: movie.releaseDate ?? undefined,
    runtime: movie.runtime ?? null,
    poster_path: movie.posterPath ?? null,
    backdrop_path: movie.backdropPath ?? null,
    vote_average: movie.voteAverage ?? undefined,
    vote_count: movie.voteCount ?? undefined,
    popularity: movie.popularity ?? undefined,
    genre_ids: Array.isArray(movie.genres) ? (movie.genres as number[]) : undefined,
  };
}
