import type { TmdbMediaType } from "../_shared/tmdb.ts";

export type TmdbAction = "search" | "discover" | "find" | "movie" | "trending";

export interface RequestBody {
  action?: TmdbAction;
  query?: string;
  page?: number;
  tmdb_id?: number;
  external_id?: string;
  source?: string;
  language?: string;
  media_type?: TmdbMediaType;
  time_window?: "day" | "week";
  params?: Record<string, string | number | boolean | undefined>;
}

export interface HandlerContext {
  language: string;
  warmCache: (work: Promise<void>) => void;
  mediaTypeOf: (value: string | undefined) => TmdbMediaType;
}

export type Handler = (body: RequestBody, ctx: HandlerContext) => Promise<Response>;
