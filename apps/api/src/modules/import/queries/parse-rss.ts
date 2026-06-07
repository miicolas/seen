import { letterboxdRatingToStored, parseYear, type NormalizedRow } from "../shared";

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function tag(item: string, name: string): string | undefined {
  const match = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? decodeEntities(match[1]).trim() : undefined;
}

// Letterboxd member RSS (`/<username>/rss/`) carries the exact `tmdb:movieId`
// plus the member's rating, so these rows skip title/year matching entirely.
// We import the rating only: the feed's `description` is HTML (poster markup,
// "Watched on …") rather than clean review text, and the watchlist is not in the
// feed. Written reviews come through the CSV path instead.
export function parseLetterboxdRss(xml: string): NormalizedRow[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const byTmdbId = new Map<number, NormalizedRow>();

  for (const item of items) {
    const tmdbId = Number.parseInt(tag(item, "tmdb:movieId") ?? "", 10);
    if (!Number.isFinite(tmdbId)) continue; // list items and non-film entries

    const title = tag(item, "letterboxd:filmTitle");
    if (!title) continue;

    const stored = letterboxdRatingToStored(Number(tag(item, "letterboxd:memberRating")));
    if (stored == null) continue; // watched-without-rating is out of v1 scope

    const existing = byTmdbId.get(tmdbId);
    if (existing?.rating != null) continue; // keep the most recent rating (feed is newest-first)
    byTmdbId.set(tmdbId, {
      target: "review",
      title,
      year: parseYear(tag(item, "letterboxd:filmYear")),
      tmdbId,
      rating: stored,
    });
  }

  return [...byTmdbId.values()];
}
