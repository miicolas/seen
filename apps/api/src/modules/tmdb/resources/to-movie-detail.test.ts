import { describe, expect, it } from "bun:test";

import { toMovieDetail } from "./to-movie-detail";

const baseMovie = {
  id: 603,
  title: "The Matrix",
  overview: "A hacker discovers reality is a simulation.",
  release_date: "1999-03-31",
  vote_average: 8.2,
  vote_count: 26000,
};

describe("toMovieDetail", () => {
  it("maps a raw movie payload", () => {
    const detail = toMovieDetail({ ...baseMovie, runtime: 136 }, "movie", "miss");

    expect(detail.id).toBe(603);
    expect(detail.media_type).toBe("movie");
    expect(detail.title).toBe("The Matrix");
    expect(detail.runtime).toBe(136);
    expect(detail._cache).toBe("miss");
  });

  it("flattens movie keywords nested under keywords.keywords", () => {
    const detail = toMovieDetail(
      {
        ...baseMovie,
        keywords: {
          keywords: [
            { id: 1, name: "simulation" },
            { id: 2, name: "dystopia" },
          ],
        },
      },
      "movie",
      "miss",
    );

    expect(detail.keywords).toEqual([
      { id: 1, name: "simulation" },
      { id: 2, name: "dystopia" },
    ]);
  });

  it("flattens tv keywords nested under keywords.results", () => {
    const detail = toMovieDetail(
      {
        id: 1396,
        name: "Breaking Bad",
        keywords: { results: [{ id: 3, name: "drug cartel" }] },
      },
      "tv",
      "miss",
    );

    expect(detail.media_type).toBe("tv");
    expect(detail.keywords).toEqual([{ id: 3, name: "drug cartel" }]);
  });

  it("accepts already-flat keywords when re-mapping a cached DTO", () => {
    const first = toMovieDetail(
      { ...baseMovie, keywords: { keywords: [{ id: 1, name: "simulation" }] } },
      "movie",
      "miss",
    );
    const second = toMovieDetail(first as unknown as Record<string, unknown>, "movie", "hit");

    expect(second.keywords).toEqual([{ id: 1, name: "simulation" }]);
    expect(second._cache).toBe("hit");
  });

  it("drops malformed keyword entries and returns undefined when none survive", () => {
    const detail = toMovieDetail(
      { ...baseMovie, keywords: { keywords: [{ id: "nope" }, { name: 42 }] } },
      "movie",
      "miss",
    );

    expect(detail.keywords).toBeUndefined();
  });

  it("falls back to the tv name/first_air_date fields", () => {
    const detail = toMovieDetail(
      { id: 1396, name: "Breaking Bad", first_air_date: "2008-01-20" },
      "tv",
      "hit",
    );

    expect(detail.title).toBe("Breaking Bad");
    expect(detail.release_date).toBe("2008-01-20");
  });
});
