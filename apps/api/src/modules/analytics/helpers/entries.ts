import type { WatchEntry } from "../shared";
import { storedToStars } from "../shared";

export function countKinds(entries: WatchEntry[]): { media_count: number; episode_count: number } {
  let media_count = 0;
  let episode_count = 0;
  for (const entry of entries) {
    if (entry.kind === "media") media_count += 1;
    else episode_count += 1;
  }
  return { media_count, episode_count };
}

export function averageRatingOf(entries: WatchEntry[]): number | null {
  let sum = 0;
  let count = 0;
  for (const entry of entries) {
    if (entry.kind === "media" && entry.rating != null) {
      sum += entry.rating;
      count += 1;
    }
  }
  return count ? storedToStars(sum / count) : null;
}
