import { eden, unwrapEden } from "@/lib/eden";

import type { ImportSummary } from "../types";

// Quick-connect import from a public Letterboxd profile's RSS feed.
export async function importLetterboxdRss(username: string): Promise<ImportSummary> {
  return unwrapEden<ImportSummary>(eden.import.letterboxd.rss.post({ username }));
}
