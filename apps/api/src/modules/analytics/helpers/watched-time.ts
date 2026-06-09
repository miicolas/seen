import type { WatchedTime, WatchEntry } from "../shared";

export function emptyWatchedTime(): WatchedTime {
  return { exact_minutes: 0, estimated_minutes: 0, unknown_count: 0 };
}

export function accumulateWatchedTime(entries: WatchEntry[]): WatchedTime {
  const total = emptyWatchedTime();
  for (const entry of entries) {
    if (!entry.countsTowardTime) continue;
    const minutes = entry.runtimeMinutes ?? 0;
    if (entry.runtimeConfidence === "exact" && minutes > 0) {
      total.exact_minutes += minutes;
    } else if (entry.runtimeConfidence === "estimated" && minutes > 0) {
      total.estimated_minutes += minutes;
    } else {
      total.unknown_count += 1;
    }
  }
  return total;
}

export function totalMinutes(time: WatchedTime): number {
  return time.exact_minutes + time.estimated_minutes;
}
