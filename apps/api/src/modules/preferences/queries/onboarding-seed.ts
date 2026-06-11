import { getMediaDetail } from "../../tmdb";
import type { SeedItemDto } from "../model";
import { SEED_TITLES } from "../seed";
import { getSeenKeys } from "./get-seen-keys";
import { toSeedItem } from "./to-seed-item";

// Returns the curated seed (already-seen titles removed), resolved to cards via
// the TMDB cache, in the diverse round-robin order. The client slices ~8/~18.
export async function getOnboardingSeed(userId: string): Promise<SeedItemDto[]> {
  const seen = await getSeenKeys(
    userId,
    SEED_TITLES.map((entry) => entry.tmdbId),
  );
  const remaining = SEED_TITLES.filter((entry) => !seen.has(`${entry.mediaType}:${entry.tmdbId}`));

  const items = await Promise.all(
    remaining.map(async (entry) => {
      try {
        return toSeedItem(await getMediaDetail(entry.mediaType, entry.tmdbId));
      } catch {
        return null;
      }
    }),
  );

  return items.filter((item): item is SeedItemDto => item !== null);
}
