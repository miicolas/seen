import { db } from "@seen/db";
import { movies as moviesTable } from "@seen/db/schema";
import { and, eq } from "drizzle-orm";

import {
  DEFAULT_LANGUAGE,
  DETAIL_APPEND,
  DETAIL_TTL_MS,
  type MediaType,
  type TmdbMovieDetail,
  normalizeSummary,
  tmdbFetch,
  upsertMovieDetail,
} from "../client";

export async function getMediaDetail(
  mediaType: MediaType,
  tmdbId: number,
  language = DEFAULT_LANGUAGE,
): Promise<TmdbMovieDetail> {
  const [row] = await db
    .select({
      detail: moviesTable.detail,
      detailFetchedAt: moviesTable.detailFetchedAt,
      language: moviesTable.language,
    })
    .from(moviesTable)
    .where(
      and(eq(moviesTable.tmdbId, tmdbId), eq(moviesTable.mediaType, mediaType)),
    )
    .limit(1);

  if (
    row?.detail &&
    row.detailFetchedAt &&
    (!row.language || row.language === language) &&
    Date.now() - row.detailFetchedAt.getTime() < DETAIL_TTL_MS
  ) {
    return { ...(row.detail as TmdbMovieDetail), _cache: "hit" };
  }

  const detail = await tmdbFetch<TmdbMovieDetail>(
    `/${mediaType}/${tmdbId}`,
    {
      language,
      append_to_response: DETAIL_APPEND[mediaType],
    },
    60 * 60,
  );
  const normalized = {
    ...detail,
    ...normalizeSummary({ ...detail, media_type: mediaType }, mediaType),
    _cache: "miss" as const,
  };
  await upsertMovieDetail(normalized, language);
  return normalized;
}
