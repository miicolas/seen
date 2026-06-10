import { discover } from "../../tmdb/summaries";
import { hasRating } from "../../tmdb/normalize";
import type { TmdbMovieSummary } from "../../tmdb";

// Pool filler for sparse accounts (few ratings, no neighbors, no follows): pull
// widely-seen, well-rated titles from TMDB discover so the pool always reaches
// its target size. The page is salted so consecutive computes rotate through
// different slices of the catalog.
const MIN_VOTE_COUNT = 1000;
const MIN_VOTE_AVERAGE = 7;
const PAGE_ROTATION = 5;

export async function getQualityTopUp(pageSalt: number): Promise<TmdbMovieSummary[]> {
  const page = 1 + (Math.abs(pageSalt) % PAGE_ROTATION);
  const params = {
    sort_by: "vote_count.desc",
    "vote_count.gte": MIN_VOTE_COUNT,
    "vote_average.gte": MIN_VOTE_AVERAGE,
    page,
  };
  const [movies, series] = await Promise.all([
    discover("movie", params).catch(() => [] as TmdbMovieSummary[]),
    discover("tv", params).catch(() => [] as TmdbMovieSummary[]),
  ]);
  return [...movies, ...series].filter(hasRating);
}
