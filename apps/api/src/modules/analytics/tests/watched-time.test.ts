import { describe, expect, test } from "bun:test";

import { accumulateWatchedTime } from "../helpers/watched-time";
import { buildOverview } from "../helpers/overview";
import { computeClearance } from "../helpers/watchlist";
import { computeRange } from "../range";
import { entry } from "./fixtures";

describe("accumulateWatchedTime", () => {
  test("splits exact / estimated / unknown and ignores tv-series logs", () => {
    const time = accumulateWatchedTime([
      entry({ mediaType: "movie", runtimeMinutes: 120, runtimeConfidence: "exact" }),
      entry({ mediaType: "movie", runtimeMinutes: null, runtimeConfidence: "unknown" }),
      entry({
        kind: "episode",
        mediaType: "tv",
        runtimeMinutes: 45,
        runtimeConfidence: "estimated",
      }),
      entry({ kind: "episode", mediaType: "tv", runtimeMinutes: 50, runtimeConfidence: "exact" }),
      // a series-level tv review: a log, not minutes — must not touch any bucket
      entry({ mediaType: "tv", kind: "media", runtimeMinutes: null, countsTowardTime: false }),
    ]);
    expect(time.exact_minutes).toBe(170);
    expect(time.estimated_minutes).toBe(45);
    expect(time.unknown_count).toBe(1);
  });

  test("an exact entry with zero minutes counts as unknown, not exact", () => {
    const time = accumulateWatchedTime([entry({ runtimeMinutes: 0, runtimeConfidence: "exact" })]);
    expect(time.exact_minutes).toBe(0);
    expect(time.unknown_count).toBe(1);
  });
});

describe("computeClearance", () => {
  test("weeks-to-clear divides backlog by weekly velocity", () => {
    // 14 watched over 28 days = 0.5/day = 3.5/week; backlog 7 → 2 weeks
    const clearance = computeClearance(7, 14, 28);
    expect(clearance.per_week).toBe(3.5);
    expect(clearance.weeks_to_clear).toBe(2);
  });

  test("no watching means the backlog never clears", () => {
    const clearance = computeClearance(10, 0, 30);
    expect(clearance.per_week).toBe(0);
    expect(clearance.weeks_to_clear).toBeNull();
  });
});

describe("buildOverview", () => {
  test("computes totals, counts and previous-period delta", () => {
    const period = computeRange("week", "UTC", new Date("2026-06-08T12:00:00Z"));
    const current = [
      entry({ mediaType: "movie", runtimeMinutes: 100, runtimeConfidence: "exact", rating: 8 }),
      entry({ kind: "episode", mediaType: "tv", runtimeMinutes: 50, runtimeConfidence: "exact" }),
    ];
    const previous = [
      entry({ mediaType: "movie", runtimeMinutes: 50, runtimeConfidence: "exact" }),
    ];
    const overview = buildOverview(
      current,
      previous,
      {
        count: 3,
        movie_count: 2,
        tv_count: 1,
        added_in_range: 1,
        watched_in_range: 1,
        per_week: 1,
        weeks_to_clear: 3,
        oldest_added_at: null,
      },
      period,
    );

    expect(overview.total_minutes).toBe(150);
    expect(overview.media_count).toBe(1);
    expect(overview.episode_count).toBe(1);
    expect(overview.average_rating).toBe(4); // stored 8 → 4 stars
    expect(overview.previous.total_minutes).toBe(50);
    expect(overview.deltas.minutes).toBe(100);
    expect(overview.deltas.minutes_pct).toBe(2); // (150-50)/50
  });
});
