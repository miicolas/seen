import type { TmdbMovieSummary } from "./types";

// Seen only surfaces released titles. A title with no TMDB rating is treated as
// not-yet-released and filtered out of every list. The rating value itself is
// never shown in the UI — it only gates what we display.
export function hasRating(media: TmdbMovieSummary): boolean {
  return typeof media.vote_average === "number" && media.vote_average > 0;
}
