import { genreName, round, storedToStars, type WatchEntry } from "../shared";

export type GenreCount = { genre: string; count: number; share: number };
export type GenreRating = { genre: string; avg_rating: number; count: number };
export type DecadeCount = { decade: number; label: string; count: number; share: number };
export type RuntimeBucket = { bucket: "short" | "medium" | "long"; label: string; count: number };
export type CurrentEra = { decade: number | null; label: string; count: number; share: number };
export type Contradiction = { id: string; label: string };

export type Taste = {
  total_logged: number;
  total_rated: number;
  genre_mix: GenreCount[];
  highest_rated_genres: GenreRating[];
  rating_distribution: number[];
  average_rating: number | null;
  decade_mix: DecadeCount[];
  runtime_mix: RuntimeBucket[];
  media_type_mix: { movie: number; tv: number };
  current_era: CurrentEra;
  contradictions: Contradiction[];
};

const decadeOf = (year: number) => Math.floor(year / 10) * 10;

export function computeCurrentEra(entries: WatchEntry[]): CurrentEra {
  const counts = new Map<number, number>();
  let withYear = 0;
  for (const entry of entries) {
    if (entry.releaseYear == null) continue;
    const decade = decadeOf(entry.releaseYear);
    counts.set(decade, (counts.get(decade) ?? 0) + 1);
    withYear += 1;
  }
  if (withYear === 0) return { decade: null, label: "—", count: 0, share: 0 };

  let bestDecade = -Infinity;
  let bestCount = 0;
  for (const [decade, count] of counts) {
    if (count > bestCount || (count === bestCount && decade > bestDecade)) {
      bestDecade = decade;
      bestCount = count;
    }
  }
  return {
    decade: bestDecade,
    label: `${bestDecade}s`,
    count: bestCount,
    share: round(bestCount / withYear),
  };
}

function runtimeMix(entries: WatchEntry[]): RuntimeBucket[] {
  let short = 0;
  let medium = 0;
  let long = 0;
  for (const entry of entries) {
    if (entry.mediaType !== "movie" || !entry.runtimeMinutes || entry.runtimeMinutes <= 0) continue;
    if (entry.runtimeMinutes < 90) short += 1;
    else if (entry.runtimeMinutes <= 120) medium += 1;
    else long += 1;
  }
  return [
    { bucket: "short", label: "Under 90m", count: short },
    { bucket: "medium", label: "90–120m", count: medium },
    { bucket: "long", label: "Over 120m", count: long },
  ];
}

function contradictions(
  genreMix: GenreCount[],
  highestRated: GenreRating[],
  entries: WatchEntry[],
): Contradiction[] {
  const out: Contradiction[] = [];

  const mostWatched = genreMix[0]?.genre;
  const ratedTop = highestRated[0]?.genre;
  if (mostWatched && ratedTop && mostWatched !== ratedTop) {
    out.push({
      id: "watch-vs-rate",
      label: `You watch the most ${mostWatched}, but rate ${ratedTop} highest.`,
    });
  }

  let oldSum = 0;
  let oldCount = 0;
  let newSum = 0;
  let newCount = 0;
  for (const entry of entries) {
    if (entry.rating == null || entry.releaseYear == null) continue;
    if (entry.releaseYear < 2000) {
      oldSum += entry.rating;
      oldCount += 1;
    } else {
      newSum += entry.rating;
      newCount += 1;
    }
  }
  if (oldCount >= 3 && newCount >= 3) {
    const oldAvg = oldSum / oldCount;
    const newAvg = newSum / newCount;
    if (oldAvg - newAvg >= 1) {
      out.push({
        id: "old-vs-new",
        label: "You rate pre-2000 films noticeably higher than newer ones.",
      });
    }
  }

  return out.slice(0, 2);
}

export function buildTaste(allEntries: WatchEntry[]): Taste {
  const media = allEntries.filter((entry) => entry.kind === "media");

  const genreCounts = new Map<string, number>();
  let genreTags = 0;
  const genreRatingSum = new Map<string, number>();
  const genreRatingCount = new Map<string, number>();
  const decadeCounts = new Map<number, number>();
  let withYear = 0;
  const distribution = new Array<number>(10).fill(0);
  let ratingSum = 0;
  let ratingCount = 0;
  let movieCount = 0;
  let tvCount = 0;

  for (const entry of media) {
    if (entry.mediaType === "movie") movieCount += 1;
    else tvCount += 1;

    for (const id of entry.genreIds) {
      const name = genreName(id);
      genreCounts.set(name, (genreCounts.get(name) ?? 0) + 1);
      genreTags += 1;
      if (entry.rating != null) {
        genreRatingSum.set(name, (genreRatingSum.get(name) ?? 0) + entry.rating);
        genreRatingCount.set(name, (genreRatingCount.get(name) ?? 0) + 1);
      }
    }

    if (entry.releaseYear != null) {
      const decade = decadeOf(entry.releaseYear);
      decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1);
      withYear += 1;
    }

    if (entry.rating != null && entry.rating >= 1 && entry.rating <= 10) {
      distribution[entry.rating - 1] += 1;
      ratingSum += entry.rating;
      ratingCount += 1;
    }
  }

  const genreMix: GenreCount[] = [...genreCounts.entries()]
    .map(([genre, count]) => ({ genre, count, share: genreTags ? round(count / genreTags) : 0 }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre))
    .slice(0, 8);

  const highestRated: GenreRating[] = [...genreRatingCount.entries()]
    .filter(([, count]) => count >= 2)
    .map(([genre, count]) => ({
      genre,
      count,
      avg_rating: storedToStars((genreRatingSum.get(genre) ?? 0) / count),
    }))
    .sort((a, b) => b.avg_rating - a.avg_rating || b.count - a.count)
    .slice(0, 5);

  const decadeMix: DecadeCount[] = [...decadeCounts.entries()]
    .map(([decade, count]) => ({
      decade,
      label: `${decade}s`,
      count,
      share: withYear ? round(count / withYear) : 0,
    }))
    .sort((a, b) => a.decade - b.decade);

  return {
    total_logged: media.length,
    total_rated: ratingCount,
    genre_mix: genreMix,
    highest_rated_genres: highestRated,
    rating_distribution: distribution,
    average_rating: ratingCount ? storedToStars(ratingSum / ratingCount) : null,
    decade_mix: decadeMix,
    runtime_mix: runtimeMix(media),
    media_type_mix: { movie: movieCount, tv: tvCount },
    current_era: computeCurrentEra(media),
    contradictions: contradictions(genreMix, highestRated, media),
  };
}
