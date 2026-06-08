import { describe, expect, test } from "bun:test";

import { attributeDiscovery } from "../helpers/discovery-flow";
import type { DiscoveryImpression, DiscoveryInteraction, Period } from "../shared";

const PERIOD: Period = {
  range: "month",
  timezone: "UTC",
  from: "2026-06-01T00:00:00.000Z",
  to: "2026-07-01T00:00:00.000Z",
  previous_from: "2026-05-01T00:00:00.000Z",
  previous_to: "2026-06-01T00:00:00.000Z",
};

const noFlags = {
  clicked: false,
  addedToWatchlist: false,
  markedWatched: false,
  rated: false,
  shared: false,
  dismissed: false,
};

type ImpressionOverrides = Partial<Omit<DiscoveryImpression, "flags">> & {
  flags?: Partial<DiscoveryImpression["flags"]>;
};

function impression(o: ImpressionOverrides): DiscoveryImpression {
  return {
    tmdbId: o.tmdbId ?? 1,
    mediaType: o.mediaType ?? "movie",
    source: o.source ?? "trending",
    shownAt: o.shownAt ?? new Date("2026-06-05T10:00:00Z"),
    inRange: o.inRange ?? true,
    flags: { ...noFlags, ...o.flags },
  };
}

function interaction(o: Partial<DiscoveryInteraction>): DiscoveryInteraction {
  return {
    tmdbId: o.tmdbId ?? 1,
    mediaType: o.mediaType ?? "movie",
    type: o.type ?? "opened_detail",
    createdAt: o.createdAt ?? new Date("2026-06-05T11:00:00Z"),
  };
}

describe("attributeDiscovery", () => {
  test("credits outcomes to the most recent impression, dedupes flags, ignores stale/organic", () => {
    const impressions = [
      impression({
        tmdbId: 1,
        source: "trending",
        shownAt: new Date("2026-06-05T10:00:00Z"),
        flags: { clicked: true },
      }),
      impression({
        tmdbId: 2,
        source: "availability",
        shownAt: new Date("2026-06-10T10:00:00Z"),
        flags: { dismissed: true },
      }),
      // shown 17 days before the interaction → outside the 14-day window
      impression({
        tmdbId: 3,
        source: "content",
        shownAt: new Date("2026-05-20T10:00:00Z"),
        inRange: false,
      }),
    ];
    const interactions = [
      interaction({
        tmdbId: 1,
        type: "opened_detail",
        createdAt: new Date("2026-06-05T11:00:00Z"),
      }),
      interaction({
        tmdbId: 1,
        type: "added_watchlist",
        createdAt: new Date("2026-06-06T09:00:00Z"),
      }),
      interaction({
        tmdbId: 3,
        type: "opened_detail",
        createdAt: new Date("2026-06-06T09:00:00Z"),
      }),
      interaction({ tmdbId: 99, type: "rated", createdAt: new Date("2026-06-07T09:00:00Z") }),
    ];

    const flow = attributeDiscovery(impressions, interactions, PERIOD);
    const byKey = Object.fromEntries(flow.by_source.map((row) => [row.source, row]));

    expect(byKey.trending.impressions).toBe(1);
    expect(byKey.trending.detail_opens).toBe(1); // interaction wins, clicked flag deduped (not 2)
    expect(byKey.trending.watchlist_adds).toBe(1);
    expect(byKey.availability.impressions).toBe(1);
    expect(byKey.availability.dismissals).toBe(1); // from the flag, no interaction
    expect(byKey.content).toBeUndefined(); // impression out of range, interaction out of window

    expect(flow.totals.impressions).toBe(2);
    expect(flow.totals.detail_opens).toBe(1);
    expect(flow.totals.watchlist_adds).toBe(1);
    expect(flow.totals.dismissals).toBe(1);
  });

  test("interactions outside the period window are not counted", () => {
    const flow = attributeDiscovery(
      [impression({ tmdbId: 1, source: "trending", shownAt: new Date("2026-06-05T10:00:00Z") })],
      [
        interaction({
          tmdbId: 1,
          type: "opened_detail",
          createdAt: new Date("2026-07-05T10:00:00Z"),
        }),
      ],
      PERIOD,
    );
    const trending = flow.by_source.find((row) => row.source === "trending");
    expect(trending?.detail_opens ?? 0).toBe(0);
  });
});
