import { search, type TmdbMovieSummary } from "../../tmdb";
import { normalizeTitle, releaseYear } from "../shared";

export type MatchResult =
  | { status: "matched"; summary: TmdbMovieSummary }
  | { status: "unmatched"; candidates: TmdbMovieSummary[] };

const MAX_CANDIDATES = 5;

// Resolve a Letterboxd film (title + release year) to a single TMDB movie.
// Letterboxd exports carry no external ids, so this is the accuracy-critical step.
// High confidence = an unambiguous title+year hit; anything else is returned as
// candidates for the user to disambiguate on the review-unmatched screen.
export async function matchByTitleYear(title: string, year?: number): Promise<MatchResult> {
  const results = (await search("movie", title)).filter((item) => item.media_type === "movie");
  if (!results.length) return { status: "unmatched", candidates: [] };

  const wanted = normalizeTitle(title);
  const titleMatches = results.filter((item) => normalizeTitle(item.title ?? "") === wanted);

  if (year != null) {
    const yearMatches = results.filter((item) => releaseYear(item) === year);
    const exact = yearMatches.filter((item) => normalizeTitle(item.title ?? "") === wanted);
    if (exact.length === 1) return { status: "matched", summary: exact[0] };
    if (yearMatches.length === 1) return { status: "matched", summary: yearMatches[0] };
  } else if (titleMatches.length === 1) {
    return { status: "matched", summary: titleMatches[0] };
  }

  return { status: "unmatched", candidates: results.slice(0, MAX_CANDIDATES) };
}
