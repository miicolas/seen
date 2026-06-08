import { describe, expect, test } from "bun:test";

import { parseLetterboxdFiles } from "../queries/parse-csv";
import { parseLetterboxdDate } from "../shared";

const MATRIX_URI = "https://letterboxd.com/x/film/the-matrix/";

describe("parseLetterboxdDate", () => {
  test("parses a calendar day to UTC midnight", () => {
    expect(parseLetterboxdDate("2026-05-01")).toBe("2026-05-01T00:00:00.000Z");
  });

  test("drops future and unparseable dates", () => {
    expect(parseLetterboxdDate("2999-01-01")).toBeUndefined();
    expect(parseLetterboxdDate("not a date")).toBeUndefined();
    expect(parseLetterboxdDate(undefined)).toBeUndefined();
  });
});

describe("parseLetterboxdFiles watched-date priority", () => {
  const files = {
    "diary.csv": [
      "Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date",
      `2026-06-08,The Matrix,1999,${MATRIX_URI},4.0,No,,2026-05-01`,
    ].join("\n"),
    "ratings.csv": [
      "Date,Name,Year,Letterboxd URI,Rating",
      `2026-06-08,The Matrix,1999,${MATRIX_URI},4.5`,
      "2026-06-03,Heat,1995,https://letterboxd.com/x/film/heat/,5.0",
    ].join("\n"),
    "watched.csv": [
      "Date,Name,Year,Letterboxd URI",
      "2026-02-02,Tenet,2020,https://letterboxd.com/x/film/tenet/",
    ].join("\n"),
    "watchlist.csv": [
      "Date,Name,Year,Letterboxd URI",
      "2026-04-01,Dune,2021,https://letterboxd.com/x/film/dune/",
    ].join("\n"),
  };

  const rows = parseLetterboxdFiles(files);
  const byTitle = Object.fromEntries(rows.map((row) => [row.title, row]));

  test("diary 'Watched Date' beats the ratings 'Date'", () => {
    expect(byTitle["The Matrix"].watchedAt).toBe("2026-05-01T00:00:00.000Z");
    // ratings.csv carries the canonical current rating (4.5 → stored 9)
    expect(byTitle["The Matrix"].rating).toBe(9);
  });

  test("a ratings-only film falls back to its rated date", () => {
    expect(byTitle["Heat"].watchedAt).toBe("2026-06-03T00:00:00.000Z");
    expect(byTitle["Heat"].rating).toBe(10);
  });

  test("a watched-only film (no rating/comment) is not imported as a review", () => {
    expect(byTitle["Tenet"]).toBeUndefined();
  });

  test("watchlist rows carry their add date and target", () => {
    expect(byTitle["Dune"].target).toBe("watchlist");
    expect(byTitle["Dune"].watchedAt).toBe("2026-04-01T00:00:00.000Z");
  });
});
