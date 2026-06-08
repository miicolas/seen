import { matchByTitleYear } from "../queries/match-tmdb";
import { type ImportSummary, type NormalizedRow, toCandidate, type UnmatchedRow } from "../shared";
import { type MatchedItem, writeImport } from "./write-import";

const MATCH_CONCURRENCY = 8;

// Run `fn` over `items` with at most `limit` in flight, preserving input order.
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

type RowResult = { kind: "matched"; item: MatchedItem } | { kind: "unmatched"; row: UnmatchedRow };

async function resolveRow(row: NormalizedRow): Promise<RowResult> {
  if (row.tmdbId != null) {
    return {
      kind: "matched",
      item: {
        tmdbId: row.tmdbId,
        target: row.target,
        rating: row.rating,
        comment: row.comment,
        watchedAt: row.watchedAt,
      },
    };
  }

  const result = await matchByTitleYear(row.title, row.year);
  if (result.status === "matched") {
    return {
      kind: "matched",
      item: {
        tmdbId: result.summary.id,
        target: row.target,
        rating: row.rating,
        comment: row.comment,
        watchedAt: row.watchedAt,
        summary: result.summary,
      },
    };
  }

  return {
    kind: "unmatched",
    row: {
      target: row.target,
      title: row.title,
      year: row.year,
      uri: row.uri,
      rating: row.rating,
      comment: row.comment,
      watched_at: row.watchedAt,
      candidates: result.candidates.map(toCandidate),
    },
  };
}

// Match every normalized row to TMDB, write the confident hits, and hand back the
// ambiguous ones for the user to resolve.
export async function runImport(userId: string, rows: NormalizedRow[]): Promise<ImportSummary> {
  const resolved = await mapPool(rows, MATCH_CONCURRENCY, resolveRow);

  const matched: MatchedItem[] = [];
  const unmatched: UnmatchedRow[] = [];
  for (const result of resolved) {
    if (result.kind === "matched") matched.push(result.item);
    else unmatched.push(result.row);
  }

  const imported = await writeImport(userId, matched);
  return { imported, skipped: matched.length - imported, unmatched };
}
