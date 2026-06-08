import { describe, expect, test } from "bun:test";

import { buildTimeline } from "../helpers/timeline";
import type { Period } from "../shared";
import { entry } from "./fixtures";

const WEEK: Period = {
  range: "week",
  timezone: "UTC",
  from: "2026-06-01T00:00:00.000Z",
  to: "2026-06-07T23:59:59.000Z",
  previous_from: "2026-05-25T00:00:00.000Z",
  previous_to: "2026-06-01T00:00:00.000Z",
};

describe("buildTimeline", () => {
  test("buckets entries by day and fills empty days", () => {
    const timeline = buildTimeline(
      [
        entry({ mediaType: "movie", runtimeMinutes: 100, runtimeConfidence: "exact", watchedAt: new Date("2026-06-02T10:00:00Z") }),
        entry({ kind: "episode", mediaType: "tv", runtimeMinutes: 50, runtimeConfidence: "exact", watchedAt: new Date("2026-06-02T20:00:00Z") }),
        entry({ mediaType: "movie", runtimeMinutes: 90, runtimeConfidence: "exact", watchedAt: new Date("2026-06-05T10:00:00Z") }),
      ],
      WEEK,
      "UTC",
    );

    expect(timeline.granularity).toBe("day");
    expect(timeline.buckets).toHaveLength(7); // Jun 1..7

    const jun2 = timeline.buckets.find((b) => b.key === "2026-06-02");
    expect(jun2?.total_minutes).toBe(150);
    expect(jun2?.media_count).toBe(1);
    expect(jun2?.episode_count).toBe(1);

    const jun5 = timeline.buckets.find((b) => b.key === "2026-06-05");
    expect(jun5?.total_minutes).toBe(90);

    const jun1 = timeline.buckets.find((b) => b.key === "2026-06-01");
    expect(jun1?.total_minutes).toBe(0);
    expect(jun1?.media_count).toBe(0);
  });

  test("week buckets carry weekday labels", () => {
    const timeline = buildTimeline([], WEEK, "UTC");
    // 2026-06-01 is a Monday
    expect(timeline.buckets[0].label).toBe("Mon");
  });
});
