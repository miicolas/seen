import { strFromU8, unzipSync } from "fflate";

import {
  letterboxdRatingToStored,
  normalizeTitle,
  parseLetterboxdDate,
  parseYear,
  type NormalizedRow,
} from "../shared";

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

// A watched-date source, in descending order of authority. diary.csv and
// reviews.csv carry an explicit "Watched Date"; ratings.csv / watched.csv only
// carry the day the entry was logged ("Date"), which is the best proxy available.
type ReviewSource = {
  records: CsvRecord[];
  withComment: boolean;
  dateColumn: "Watched Date" | "Date";
  priority: number;
};

function rowWatchedDate(record: CsvRecord, dateColumn: "Watched Date" | "Date"): string | undefined {
  if (dateColumn === "Watched Date") {
    return parseLetterboxdDate(record["Watched Date"]) ?? parseLetterboxdDate(record["Date"]);
  }
  return parseLetterboxdDate(record["Date"]);
}

// Merge diary/ratings/reviews/watched into one review row per film (keyed by the
// Letterboxd URI). A film that was rated, reviewed and logged yields a single Seen
// review carrying its rating, comment and best watched date — the highest-priority
// source with a date wins, and within a source the latest watch is kept.
function buildReviewRows(sources: ReviewSource[]): NormalizedRow[] {
  const byKey = new Map<string, NormalizedRow>();
  const datePriority = new Map<string, number>();

  for (const source of sources) {
    for (const record of source.records) {
      const title = record["Name"]?.trim();
      if (!title) continue;
      const year = parseYear(record["Year"]);
      const uri = record["Letterboxd URI"] || undefined;
      const key = reviewKey(title, year, uri);
      const row = byKey.get(key) ?? { target: "review", title, year, uri };

      const rawRating = record["Rating"]?.trim();
      const rating = rawRating ? letterboxdRatingToStored(Number(rawRating)) : null;
      if (rating != null) row.rating = rating;

      if (source.withComment) {
        const comment = record["Review"]?.trim();
        if (comment) row.comment = comment;
      }

      const watchedAt = rowWatchedDate(record, source.dateColumn);
      if (watchedAt) {
        const current = datePriority.get(key) ?? 0;
        if (
          source.priority > current ||
          (source.priority === current && (!row.watchedAt || watchedAt > row.watchedAt))
        ) {
          row.watchedAt = watchedAt;
          datePriority.set(key, source.priority);
        }
      }

      byKey.set(key, row);
    }
  }

  // A review needs a rating or a comment, otherwise the DB check rejects it. Films
  // that only appear in watched.csv (no rating, no review) contribute their date to
  // matching review rows but never become a bare review on their own.
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
        watchedAt: parseLetterboxdDate(record["Date"]),
      };
    })
    .filter((row): row is NormalizedRow => row !== null);
}

// Map of basename (lowercased) -> CSV text. Pulls diary/ratings/reviews/watched
// for review history (with watch dates) and watchlist for the backlog, ignoring
// lists and comments per the v1 scope.
export function parseLetterboxdFiles(files: Record<string, string>): NormalizedRow[] {
  const records = (name: string) => (files[name] ? toRecords(files[name]) : []);
  return [
    ...buildReviewRows([
      { records: records("diary.csv"), withComment: false, dateColumn: "Watched Date", priority: 4 },
      { records: records("reviews.csv"), withComment: true, dateColumn: "Watched Date", priority: 3 },
      { records: records("ratings.csv"), withComment: false, dateColumn: "Date", priority: 2 },
      { records: records("watched.csv"), withComment: false, dateColumn: "Date", priority: 1 },
    ]),
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
  if (lower.includes("diary")) {
    return buildReviewRows([
      { records, withComment: false, dateColumn: "Watched Date", priority: 4 },
    ]);
  }
  if (lower.includes("review") || header.includes("Review")) {
    return buildReviewRows([
      { records, withComment: true, dateColumn: "Watched Date", priority: 3 },
    ]);
  }
  if (lower.includes("watched")) {
    return buildReviewRows([{ records, withComment: false, dateColumn: "Date", priority: 1 }]);
  }
  return buildReviewRows([{ records, withComment: false, dateColumn: "Date", priority: 2 }]);
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
