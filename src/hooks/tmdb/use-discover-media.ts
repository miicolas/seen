import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  MEDIA_GENRE_SHELVES,
  type MediaGenreShelf,
} from "@/constants/movie-genres";
import { errorMessage } from "@/lib/format";
import {
  discoverMedia,
  hasRating,
  trendingMedia,
  type MediaFilter,
  type TmdbMovieSummary,
} from "@/lib/tmdb";

export interface GenreRow {
  key: MediaGenreShelf["key"];
  name: string;
  media: TmdbMovieSummary[];
}

interface DiscoverMedia {
  trending: TmdbMovieSummary[];
  topToday: TmdbMovieSummary[];
  newReleases: TmdbMovieSummary[];
  genres: GenreRow[];
  isLoading: boolean;
  error: string | null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

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

function combine(
  movies: TmdbMovieSummary[],
  series: TmdbMovieSummary[],
  filter: MediaFilter,
): TmdbMovieSummary[] {
  if (filter === "movie") return movies.filter(hasRating);
  if (filter === "tv") return series.filter(hasRating);
  return interleave(movies, series).filter(hasRating);
}

export function useDiscoverMedia(filter: MediaFilter = "all"): DiscoverMedia {
  const { i18n } = useTranslation();
  const language = i18n.language;
  const [trending, setTrending] = useState<TmdbMovieSummary[]>([]);
  const [topToday, setTopToday] = useState<TmdbMovieSummary[]>([]);
  const [newReleases, setNewReleases] = useState<TmdbMovieSummary[]>([]);
  const [genres, setGenres] = useState<GenreRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset state on filter or language change (React-blessed, during render).
  const [active, setActive] = useState(`${filter}:${language}`);
  if (active !== `${filter}:${language}`) {
    setActive(`${filter}:${language}`);
    setIsLoading(true);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;

    const wantMovie = filter !== "tv";
    const wantTv = filter !== "movie";
    const none = Promise.resolve<TmdbMovieSummary[]>([]);
    const date = today();

    const trendingWeekP = trendingMedia(filter, "week");
    const trendingDayP = trendingMedia(filter, "day");
    const newMoviesP = wantMovie
      ? discoverMedia("movie", {
          sort_by: "primary_release_date.desc",
          "primary_release_date.lte": date,
          "vote_count.gte": 50,
        })
      : none;
    const newSeriesP = wantTv
      ? discoverMedia("tv", {
          sort_by: "first_air_date.desc",
          "first_air_date.lte": date,
          "vote_count.gte": 50,
        })
      : none;
    const genreP = MEDIA_GENRE_SHELVES.map((genre) => ({
      key: genre.key,
      name: genre.name,
      movies: wantMovie
        ? discoverMedia("movie", {
            with_genres: genre.movieGenreId,
            sort_by: "popularity.desc",
            "vote_count.gte": 100,
          })
        : none,
      series: wantTv
        ? discoverMedia("tv", {
            with_genres: genre.tvGenreId,
            sort_by: "popularity.desc",
            "vote_count.gte": 100,
          })
        : none,
    }));

    (async () => {
      try {
        const [trendingWeek, trendingDay, newMovies, newSeries, genreRows] =
          await Promise.all([
            trendingWeekP,
            trendingDayP,
            newMoviesP,
            newSeriesP,
            Promise.all(
              genreP.map(async (genre) => ({
                key: genre.key,
                name: genre.name,
                media: combine(await genre.movies, await genre.series, filter),
              })),
            ),
          ]);

        if (cancelled) return;
        setTrending(trendingWeek.filter(hasRating));
        setTopToday(trendingDay.filter(hasRating));
        setNewReleases(combine(newMovies, newSeries, filter));
        setGenres(genreRows);
      } catch (err) {
        if (cancelled) return;
        setError(errorMessage(err, "Failed to load"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filter, language]);

  return { trending, topToday, newReleases, genres, isLoading, error };
}
