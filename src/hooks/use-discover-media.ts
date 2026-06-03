import { useEffect, useState } from "react";

import { MEDIA_GENRE_SHELVES } from "@/constants/movie-genres";
import {
  discoverMedia,
  trendingMedia,
  type TmdbMovieSummary,
} from "@/lib/tmdb";

export interface GenreRow {
  name: string;
  media: TmdbMovieSummary[];
}

interface DiscoverMedia {
  /** Mixed movie + series trending feed (this week), top-sliced for the hero. */
  trending: TmdbMovieSummary[];
  /** Mixed trending today, used for the ranked Top 10 row. */
  topToday: TmdbMovieSummary[];
  /** Newest movies and series, interleaved. */
  newReleases: TmdbMovieSummary[];
  /** One row per genre, each mixing movies and series. */
  genres: GenreRow[];
  isLoading: boolean;
  error: string | null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Alternate two lists (a, b, a, b, …) so a row mixes both media types. */
function interleave(
  a: TmdbMovieSummary[],
  b: TmdbMovieSummary[],
): TmdbMovieSummary[] {
  const out: TmdbMovieSummary[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

/**
 * Drives the Netflix-style Discover screen: every row mixes movies and series.
 * Trending rows come from `/trending/all` (already mixed); new-release and genre
 * rows fetch movies and TV in parallel and interleave them.
 */
export function useDiscoverMedia(): DiscoverMedia {
  const [trending, setTrending] = useState<TmdbMovieSummary[]>([]);
  const [topToday, setTopToday] = useState<TmdbMovieSummary[]>([]);
  const [newReleases, setNewReleases] = useState<TmdbMovieSummary[]>([]);
  const [genres, setGenres] = useState<GenreRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const date = today();
        const [
          trendingWeek,
          trendingDay,
          newMovies,
          newSeries,
          ...genreLists
        ] = await Promise.all([
          trendingMedia("all", "week"),
          trendingMedia("all", "day"),
          discoverMedia("movie", {
            sort_by: "primary_release_date.desc",
            "primary_release_date.lte": date,
            "vote_count.gte": 50,
          }),
          discoverMedia("tv", {
            sort_by: "first_air_date.desc",
            "first_air_date.lte": date,
            "vote_count.gte": 50,
          }),
          // Two calls per genre row (movies + series), flattened by Promise.all.
          ...MEDIA_GENRE_SHELVES.flatMap((genre) => [
            discoverMedia("movie", {
              with_genres: genre.movieGenreId,
              sort_by: "popularity.desc",
              "vote_count.gte": 100,
            }),
            discoverMedia("tv", {
              with_genres: genre.tvGenreId,
              sort_by: "popularity.desc",
              "vote_count.gte": 100,
            }),
          ]),
        ]);

        if (cancelled) return;
        setTrending(trendingWeek);
        setTopToday(trendingDay);
        setNewReleases(interleave(newMovies, newSeries));
        setGenres(
          MEDIA_GENRE_SHELVES.map((genre, index) => ({
            name: genre.name,
            media: interleave(
              genreLists[index * 2] ?? [],
              genreLists[index * 2 + 1] ?? [],
            ),
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

  return { trending, topToday, newReleases, genres, isLoading, error };
}
