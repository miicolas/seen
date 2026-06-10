// Hard gate shared by feed compute and serving: never recommend titles that
// are unreleased, unrated, or rated by almost nobody (junk floor). Mirrors the
// client-facing `hasRating` rule in the tmdb module.
const MIN_VOTE_COUNT = 20;

export type QualityGateRow = {
  voteAverage: number | null;
  voteCount: number | null;
  releaseDate: string | null;
};

export function passesQualityGate(row: QualityGateRow, today = new Date()): boolean {
  if (!row.voteAverage || row.voteAverage <= 0) return false;
  if (!row.voteCount || row.voteCount < MIN_VOTE_COUNT) return false;
  if (!row.releaseDate) return false;
  return row.releaseDate <= today.toISOString().slice(0, 10);
}
