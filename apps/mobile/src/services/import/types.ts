export type ImportTarget = "review" | "watchlist";

export interface TmdbCandidate {
  tmdb_id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
}

export interface UnmatchedRow {
  target: ImportTarget;
  title: string;
  year?: number;
  uri?: string;
  rating?: number | null;
  comment?: string | null;
  candidates: TmdbCandidate[];
}

export interface ImportSummary {
  imported: number;
  skipped: number;
  unmatched: UnmatchedRow[];
}

export interface ImportResolution {
  tmdb_id: number;
  target: ImportTarget;
  rating?: number | null;
  comment?: string | null;
}

export interface ImportFileInput {
  uri: string;
  name: string;
  mimeType?: string;
}
