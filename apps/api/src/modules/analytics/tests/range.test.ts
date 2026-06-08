import { describe, expect, test } from "bun:test";

import { computeRange, enumerateBuckets } from "../range";
import { tzDayKey, tzMonthKey, tzParts } from "../tz";

describe("timezone day/month keys", () => {
  test("an instant past UTC midnight is still the previous day in New York", () => {
    const instant = new Date("2026-06-08T02:00:00Z");
    expect(tzDayKey(instant, "UTC")).toBe("2026-06-08");
    expect(tzDayKey(instant, "America/New_York")).toBe("2026-06-07");
    expect(tzMonthKey(instant, "America/New_York")).toBe("2026-06");
  });
});

describe("computeRange", () => {
  const now = new Date("2026-06-08T12:00:00Z");

  test("week starts on Monday midnight in the timezone", () => {
    const period = computeRange("week", "UTC", now);
    const from = new Date(period.from);
    const parts = tzParts(from, "UTC");
    expect(parts.weekday).toBe(1); // Monday
    expect(parts.hour).toBe(0);
    expect(period.to).toBe(now.toISOString());
    expect(period.previous_to).toBe(period.from);
    // previous window is exactly 7 days earlier
    expect(new Date(period.from).getTime() - new Date(period.previous_from as string).getTime()).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
    expect(from.getTime()).toBeLessThanOrEqual(now.getTime());
  });

  test("month window respects the timezone offset", () => {
    const period = computeRange("month", "America/New_York", now);
    // June 1 00:00 EDT (UTC-4) === 04:00Z
    expect(period.from).toBe("2026-06-01T04:00:00.000Z");
    expect(period.previous_from).toBe("2026-05-01T04:00:00.000Z");
    expect(period.previous_to).toBe(period.from);
  });

  test("year window starts on Jan 1", () => {
    const period = computeRange("year", "UTC", now);
    const parts = tzParts(new Date(period.from), "UTC");
    expect(parts.month).toBe(1);
    expect(parts.day).toBe(1);
    expect(period.previous_from).toBe("2025-01-01T00:00:00.000Z");
  });

  test("all range has no bounds", () => {
    const period = computeRange("all", "UTC", now);
    expect(period.from).toBe(new Date(0).toISOString());
    expect(period.previous_from).toBeNull();
    expect(period.previous_to).toBeNull();
  });

  test("invalid timezone is handled by resolveTimeZone upstream (UTC math here)", () => {
    const period = computeRange("week", "UTC", now);
    expect(period.timezone).toBe("UTC");
  });
});

describe("enumerateBuckets", () => {
  test("day buckets are contiguous and inclusive of the end", () => {
    const keys = enumerateBuckets(
      "2026-06-01T00:00:00Z",
      "2026-06-03T12:00:00Z",
      "day",
      "UTC",
    );
    expect(keys).toEqual(["2026-06-01", "2026-06-02", "2026-06-03"]);
  });

  test("month buckets roll over the year boundary", () => {
    const keys = enumerateBuckets(
      "2025-11-15T00:00:00Z",
      "2026-02-01T00:00:00Z",
      "month",
      "UTC",
    );
    expect(keys).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});
