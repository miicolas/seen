import { eden, unwrapEden } from "@/lib/eden";

import { tmdbLanguage } from "./client";
import type { TmdbPersonDetail } from "./types";

export async function getPersonDetail(
  personId: number,
  language = tmdbLanguage(),
): Promise<TmdbPersonDetail> {
  return unwrapEden<TmdbPersonDetail>(
    eden.tmdb.person({ personId }).get({
      query: { language },
    }),
  );
}
