import { db } from "@seen/db";
import { movies as moviesTable } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import {
  DEFAULT_LANGUAGE,
  DETAIL_APPEND,
  DETAIL_TTL_MS,
  type MediaType,
  tmdbFetch,
  upsertMovieDetail,
} from "../client";
import type { MovieDetailDto } from "../model";
import { toMovieDetail } from "../resources";

export async function getMediaDetail(
  mediaType: MediaType,
  tmdbId: number,
  language = DEFAULT_LANGUAGE,
  options: { forceRefresh?: boolean } = {},
): Promise<MovieDetailDto> {
  const [row] = await db
    .select({
      detail: moviesTable.detail,
      detailFetchedAt: moviesTable.detailFetchedAt,
      language: moviesTable.language,
    })
    .from(moviesTable)
    .where(and(eq(moviesTable.tmdbId, tmdbId), eq(moviesTable.mediaType, mediaType)))
    .limit(1);

  if (
    !options.forceRefresh &&
    row?.detail &&
    row.detailFetchedAt &&
    (!row.language || row.language === language) &&
    Date.now() - row.detailFetchedAt.getTime() < DETAIL_TTL_MS
  ) {
    return toMovieDetail(row.detail as Record<string, unknown>, mediaType, "hit");
  }

  const detail = await tmdbFetch<Record<string, unknown>>(
    `/${mediaType}/${tmdbId}`,
    {
      language,
      append_to_response: DETAIL_APPEND[mediaType],
    },
    60 * 60,
  );
  const dto = toMovieDetail(detail, mediaType, "miss");
  await upsertMovieDetail(dto, detail, language);
  return dto;
}
