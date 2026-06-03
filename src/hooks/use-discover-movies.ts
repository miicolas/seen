import { useEffect, useState } from "react";

import { GENRE_SHELVES } from "@/constants/movie-genres";
import { discoverMovies, type TmdbMovieSummary } from "@/lib/tmdb";

export interface GenreRow {
  id: number;
  name: string;
  movies: TmdbMovieSummary[];
}

interface DiscoverMovies {
  newReleases: TmdbMovieSummary[];
  popular: TmdbMovieSummary[];
  topRated: TmdbMovieSummary[];
  genres: GenreRow[];
  isLoading: boolean;
  error: string | null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDiscoverMovies(): DiscoverMovies {
  const [newReleases, setNewReleases] = useState<TmdbMovieSummary[]>([]);
  const [popular, setPopular] = useState<TmdbMovieSummary[]>([]);
  const [topRated, setTopRated] = useState<TmdbMovieSummary[]>([]);
  const [genres, setGenres] = useState<GenreRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [latest, trending, top, ...genreLists] = await Promise.all([
          discoverMovies({
            sort_by: "primary_release_date.desc",
            "primary_release_date.lte": today(),
            "vote_count.gte": 50,
          }),
          discoverMovies({ sort_by: "popularity.desc", "vote_count.gte": 100 }),
          discoverMovies({
            sort_by: "vote_average.desc",
            "vote_count.gte": 300,
          }),
          ...GENRE_SHELVES.map((genre) =>
            discoverMovies({
              with_genres: genre.id,
              sort_by: "popularity.desc",
              "vote_count.gte": 100,
            }),
          ),
        ]);

        if (cancelled) return;
        setNewReleases(latest);
        setPopular(trending);
        setTopRated(top);
        setGenres(
          GENRE_SHELVES.map((genre, index) => ({
            id: genre.id,
            name: genre.name,
            movies: genreLists[index] ?? [],
          })),
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { newReleases, popular, topRated, genres, isLoading, error };
}
