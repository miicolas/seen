import { strFromU8, unzipSync } from "fflate";

import { letterboxdRatingToStored, normalizeTitle, parseYear, type NormalizedRow } from "../shared";

type CsvRecord = Record<string, string>;

// Tokenize a CSV body into rows of cells. Handles quoted fields with embedded
// commas and newlines, doubled quotes ("") and Letterboxd's backslash-escaped
// quotes (\") — review text routinely contains all three.
export function parseCsv(text: string): string[][] {
  const src = text.replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === "\\" && src[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.trim().length > 0));
}

function toRecords(text: string): CsvRecord[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((value) => value.trim());
  return rows.slice(1).map((cells) => {
    const record: CsvRecord = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] ?? "").trim();
    });
    return record;
  });
}

function reviewKey(title: string, year: number | undefined, uri: string | undefined): string {
  return uri || `${normalizeTitle(title)}::${year ?? ""}`;
}

// Merge ratings.csv + reviews.csv into one review row per film (keyed by the
// Letterboxd URI), so a film that was both rated and reviewed yields a single
// Seen review carrying the rating and the comment.
function buildReviewRows(ratings: CsvRecord[], reviewsCsv: CsvRecord[]): NormalizedRow[] {
  const byKey = new Map<string, NormalizedRow>();

  const merge = (record: CsvRecord, withComment: boolean) => {
    const title = record["Name"]?.trim();
    if (!title) return;
    const year = parseYear(record["Year"]);
    const uri = record["Letterboxd URI"] || undefined;
    const key = reviewKey(title, year, uri);
    const row = byKey.get(key) ?? { target: "review", title, year, uri };

    const rawRating = record["Rating"]?.trim();
    const rating = rawRating ? letterboxdRatingToStored(Number(rawRating)) : null;
    if (rating != null) row.rating = rating;

    if (withComment) {
      const comment = record["Review"]?.trim();
      if (comment) row.comment = comment;
    }
    byKey.set(key, row);
  };

  ratings.forEach((record) => merge(record, false));
  reviewsCsv.forEach((record) => merge(record, true));

  // A review needs a rating or a comment, otherwise the DB check rejects it.
  return [...byKey.values()].filter((row) => row.rating != null || row.comment);
}

function buildWatchlistRows(watchlistCsv: CsvRecord[]): NormalizedRow[] {
  return watchlistCsv
    .map((record): NormalizedRow | null => {
      const title = record["Name"]?.trim();
      if (!title) return null;
      return {
        target: "watchlist",
        title,
        year: parseYear(record["Year"]),
        uri: record["Letterboxd URI"] || undefined,
      };
    })
    .filter((row): row is NormalizedRow => row !== null);
}

// Map of basename (lowercased) -> CSV text. Pulls the files we import and ignores
// the rest (diary.csv, watched.csv, lists, comments) per the v1 scope.
export function parseLetterboxdFiles(files: Record<string, string>): NormalizedRow[] {
  const records = (name: string) => (files[name] ? toRecords(files[name]) : []);
  return [
    ...buildReviewRows(records("ratings.csv"), records("reviews.csv")),
    ...buildWatchlistRows(records("watchlist.csv")),
  ];
}

function looksLikeZip(bytes: Uint8Array): boolean {
  return bytes.length > 1 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

// Infer the kind of a lone uploaded CSV from its filename or header columns.
function parseSingleCsv(text: string, filename: string): NormalizedRow[] {
  const lower = filename.toLowerCase();
  const header = parseCsv(text)[0]?.map((value) => value.trim()) ?? [];
  const records = toRecords(text);

  if (lower.includes("watchlist")) return buildWatchlistRows(records);
  if (lower.includes("review") || header.includes("Review")) {
    return buildReviewRows([], records);
  }
  return buildReviewRows(records, []);
}

// Entry point: accepts the full export .zip or a single .csv.
export function parseLetterboxdExport(bytes: Uint8Array, filename: string): NormalizedRow[] {
  if (looksLikeZip(bytes) || filename.toLowerCase().endsWith(".zip")) {
    const entries = unzipSync(bytes);
    const files: Record<string, string> = {};
    for (const [path, data] of Object.entries(entries)) {
      if (!path.toLowerCase().endsWith(".csv")) continue;
      const base = path.split("/").pop()?.toLowerCase();
      if (base) files[base] = strFromU8(data);
    }
    return parseLetterboxdFiles(files);
  }
  return parseSingleCsv(strFromU8(bytes), filename);
}
