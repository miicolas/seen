import { describe, expect, test } from "bun:test";

import { buildTaste, computeCurrentEra } from "../helpers/taste";
import { entry } from "./fixtures";

describe("computeCurrentEra", () => {
  test("picks the most-watched decade, breaking ties toward the recent one", () => {
    const era = computeCurrentEra([
      entry({ releaseYear: 1995 }),
      entry({ releaseYear: 1998 }),
      entry({ releaseYear: 2021 }),
      entry({ releaseYear: 2024 }),
    ]);
    // 1990s has 2, 2020s has 2 → tie goes to the more recent decade
    expect(era.decade).toBe(2020);
    expect(era.label).toBe("2020s");
    expect(era.share).toBe(0.5);
  });

  test("no release years yields an empty era", () => {
    const era = computeCurrentEra([entry({})]);
    expect(era.decade).toBeNull();
    expect(era.count).toBe(0);
  });
});

describe("buildTaste", () => {
  test("genre mix, rating distribution, decade mix and contradictions", () => {
    const taste = buildTaste([
      entry({ genreIds: [18], rating: 10, releaseYear: 1994 }), // Drama, 5 stars
      entry({ genreIds: [18], rating: 9, releaseYear: 1999 }), // Drama
      entry({ genreIds: [28], rating: 4, releaseYear: 2022 }), // Action, low
      entry({ genreIds: [28, 18], rating: 6, releaseYear: 2023 }), // Action+Drama
      entry({ mediaType: "tv", kind: "media", genreIds: [18], rating: 8, releaseYear: 2010 }),
    ]);

    expect(taste.total_logged).toBe(5);
    expect(taste.total_rated).toBe(5);
    // Drama appears in 4 entries, Action in 2 → Drama leads the mix
    expect(taste.genre_mix[0].genre).toBe("Drama");
    expect(taste.genre_mix[0].count).toBe(4);
    // distribution is a 10-bucket histogram on the stored scale
    expect(taste.rating_distribution).toHaveLength(10);
    expect(taste.rating_distribution.reduce((a, b) => a + b, 0)).toBe(5);
    expect(taste.media_type_mix).toEqual({ movie: 4, tv: 1 });
    expect(taste.current_era.decade).not.toBeNull();
  });

  test("episodes are excluded from taste (they feed time, not identity)", () => {
    const taste = buildTaste([
      entry({ kind: "episode", mediaType: "tv", genreIds: [99], rating: 8 }),
    ]);
    expect(taste.total_logged).toBe(0);
    expect(taste.genre_mix).toHaveLength(0);
  });
});
