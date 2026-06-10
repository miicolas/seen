import { DEFAULT_LANGUAGE, MEDIA_GENRE_SHELVES, today } from "../constants";
import { combine, hasRating } from "../normalize";
import { discover, trending } from "../summaries";
import type { DiscoverFeed, MediaFilter, TmdbMovieSummary } from "../types";

export async function discoverFeed(
  filter: MediaFilter,
  language = DEFAULT_LANGUAGE,
): Promise<DiscoverFeed> {
  const wantMovie = filter !== "tv";
  const wantTv = filter !== "movie";
  const none = Promise.resolve<TmdbMovieSummary[]>([]);
  const date = today();

  const trendingWeekP = trending(filter, "week", language);
  const trendingDayP = trending(filter, "day", language);
  const newMoviesP = wantMovie
    ? discover("movie", {
        language,
        sort_by: "primary_release_date.desc",
        "primary_release_date.lte": date,
        "vote_count.gte": 50,
      })
    : none;
  const newSeriesP = wantTv
    ? discover("tv", {
        language,
        sort_by: "first_air_date.desc",
        "first_air_date.lte": date,
        "vote_count.gte": 50,
      })
    : none;

  const genreP = MEDIA_GENRE_SHELVES.map((genre) => ({
    key: genre.key,
    name: genre.name,
    movies: wantMovie
      ? discover("movie", {
          language,
          with_genres: genre.movieGenreId,
          sort_by: "popularity.desc",
          "vote_count.gte": 100,
          "vote_average.gte": 5.5,
        })
      : none,
    series: wantTv
      ? discover("tv", {
          language,
          with_genres: genre.tvGenreId,
          sort_by: "popularity.desc",
          "vote_count.gte": 100,
          "vote_average.gte": 5.5,
        })
      : none,
  }));

  const [trendingWeek, trendingDay, newMovies, newSeries, genres] = await Promise.all([
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

  return {
    trending: trendingWeek.filter(hasRating),
    topToday: trendingDay.filter(hasRating),
    newReleases: combine(newMovies, newSeries, filter),
    genres,
  };
}
