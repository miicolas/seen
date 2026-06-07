import { HttpError } from "../../../lib/http-error";
import { parseLetterboxdRss } from "../queries/parse-rss";
import type { ImportSummary } from "../shared";
import { runImport } from "./run-import";

const USERNAME_RE = /^[a-z0-9_]+$/i;

// Quick-connect import from a public Letterboxd profile's RSS feed (recent rated
// films only, with exact TMDB ids).
export async function importFromRss(userId: string, username: string): Promise<ImportSummary> {
  const handle = username.trim().replace(/^@/, "");
  if (!USERNAME_RE.test(handle)) {
    throw new HttpError(400, "Enter a valid Letterboxd username.");
  }

  let response: Response;
  try {
    response = await fetch(`https://letterboxd.com/${handle}/rss/`, {
      headers: { "User-Agent": "Seen/1.0 (+https://seen.app)" },
    });
  } catch {
    throw new HttpError(502, "Couldn't reach Letterboxd. Please try again.");
  }

  if (response.status === 404) {
    throw new HttpError(404, `No public Letterboxd profile found for "${handle}".`);
  }
  if (!response.ok) {
    throw new HttpError(502, "Couldn't reach Letterboxd. Please try again.");
  }

  const rows = parseLetterboxdRss(await response.text());
  if (!rows.length) {
    throw new HttpError(404, `No public ratings found for "${handle}".`);
  }

  return runImport(userId, rows);
}
