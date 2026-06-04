import { eden, unwrapEden } from "@/lib/eden";

import { tmdbLanguage } from "./client";
import type { DiscoverFeed, MediaFilter } from "./types";

export function getDiscoverFeed(
  filter: MediaFilter = "all",
  language = tmdbLanguage(),
): Promise<DiscoverFeed> {
  return unwrapEden<DiscoverFeed>(
    eden.tmdb.discover.get({
      query: { filter, language },
    }),
  );
}
