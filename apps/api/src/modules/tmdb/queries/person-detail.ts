import { tmdbFetch } from "../client";
import { DEFAULT_LANGUAGE } from "../constants";
import type { PersonDetailDto } from "../model";
import { toPersonDetail } from "../resources";

// Person bios + filmographies change slowly; cache for a week.
const PERSON_TTL_SECONDS = 7 * 24 * 3600;

export async function getPersonDetail(
  personId: number,
  language = DEFAULT_LANGUAGE,
): Promise<PersonDetailDto> {
  const raw = await tmdbFetch<Record<string, unknown>>(
    `/person/${personId}`,
    { language, append_to_response: "combined_credits" },
    PERSON_TTL_SECONDS,
  );
  return toPersonDetail(raw);
}
