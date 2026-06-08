import { RECOMMENDATION_SOURCES, type RecommendationSource } from "../../events/shared";
import type { DiscoveryImpression, DiscoveryInteraction, Period } from "../shared";

// The funnel outcomes, in one place — emptyFlow, the non-empty filter and the
// totals are all derived from this list so a new outcome can't silently be left
// out of one of them.
const OUTCOME_KEYS = [
  "detail_opens",
  "watchlist_adds",
  "reviews",
  "ratings",
  "likes_favorites",
  "dismissals",
] as const;

type Outcome = (typeof OUTCOME_KEYS)[number];

export type DiscoverySourceFlow = {
  source: RecommendationSource;
  impressions: number;
} & Record<Outcome, number>;

export type DiscoveryFlow = {
  period: Period;
  by_source: DiscoverySourceFlow[];
  totals: Omit<DiscoverySourceFlow, "source">;
};

const ATTRIBUTION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const INTERACTION_OUTCOME: Record<string, Outcome | undefined> = {
  opened_detail: "detail_opens",
  added_watchlist: "watchlist_adds",
  reviewed: "reviews",
  marked_watched: "reviews",
  rated: "ratings",
  liked: "likes_favorites",
  dismissed: "dismissals",
  not_interested: "dismissals",
};

const FLAG_OUTCOME: { flag: keyof DiscoveryImpression["flags"]; outcome: Outcome }[] = [
  { flag: "clicked", outcome: "detail_opens" },
  { flag: "addedToWatchlist", outcome: "watchlist_adds" },
  { flag: "markedWatched", outcome: "reviews" },
  { flag: "rated", outcome: "ratings" },
  { flag: "dismissed", outcome: "dismissals" },
];

const mediaKey = (tmdbId: number, mediaType: string | null) => `${tmdbId}:${mediaType ?? ""}`;

function emptyTotals(): Omit<DiscoverySourceFlow, "source"> {
  const totals = { impressions: 0 } as Omit<DiscoverySourceFlow, "source">;
  for (const key of OUTCOME_KEYS) totals[key] = 0;
  return totals;
}

function emptyFlow(source: RecommendationSource): DiscoverySourceFlow {
  return { source, ...emptyTotals() };
}

// Credit a discovery outcome to the shelf that surfaced it. An interaction is
// attributed to the most recent impression of the same title shown no more than 14
// days earlier; the recommendation row's own flags fill gaps but never double-count
// (an outcome already attributed via an interaction wins for that title).
export function attributeDiscovery(
  impressions: DiscoveryImpression[],
  interactions: DiscoveryInteraction[],
  period: Period,
): DiscoveryFlow {
  const from = new Date(period.from).getTime();
  const to = new Date(period.to).getTime();

  const byMedia = new Map<string, DiscoveryImpression[]>();
  for (const impression of impressions) {
    const key = mediaKey(impression.tmdbId, impression.mediaType);
    const list = byMedia.get(key) ?? [];
    list.push(impression);
    byMedia.set(key, list);
  }
  for (const list of byMedia.values())
    list.sort((a, b) => a.shownAt.getTime() - b.shownAt.getTime());

  // Impressions always carry a concrete media type; an interaction logged without
  // one matches a title across both, oldest-first.
  const candidatesFor = (tmdbId: number, mediaType: "movie" | "tv" | null) => {
    if (mediaType) return byMedia.get(mediaKey(tmdbId, mediaType)) ?? [];
    const merged = [
      ...(byMedia.get(mediaKey(tmdbId, "movie")) ?? []),
      ...(byMedia.get(mediaKey(tmdbId, "tv")) ?? []),
    ];
    merged.sort((a, b) => a.shownAt.getTime() - b.shownAt.getTime());
    return merged;
  };

  const flows = new Map<RecommendationSource, DiscoverySourceFlow>();
  const ensure = (source: RecommendationSource) => {
    let flow = flows.get(source);
    if (!flow) {
      flow = emptyFlow(source);
      flows.set(source, flow);
    }
    return flow;
  };

  const countedImpressions = new Set<DiscoveryImpression>();
  for (const impression of impressions) {
    if (impression.inRange) {
      ensure(impression.source).impressions += 1;
      countedImpressions.add(impression);
    }
  }

  const counted = new Set<string>();

  for (const interaction of interactions) {
    const at = interaction.createdAt.getTime();
    if (at < from || at >= to) continue;
    const outcome = INTERACTION_OUTCOME[interaction.type];
    if (!outcome) continue;
    const list = candidatesFor(interaction.tmdbId, interaction.mediaType);
    if (!list.length) continue;

    let chosen: DiscoveryImpression | null = null;
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const shownAt = list[i].shownAt.getTime();
      if (shownAt <= at && at - shownAt <= ATTRIBUTION_WINDOW_MS) {
        chosen = list[i];
        break;
      }
    }
    if (!chosen) continue;
    // A lookback impression (shown before the window) that earns an in-range
    // outcome still counts toward its source's impressions, so the funnel never
    // reports more outcomes than impressions.
    if (!countedImpressions.has(chosen)) {
      ensure(chosen.source).impressions += 1;
      countedImpressions.add(chosen);
    }
    ensure(chosen.source)[outcome] += 1;
    counted.add(`${mediaKey(interaction.tmdbId, chosen.mediaType)}|${outcome}`);
  }

  const flagOrder = [...impressions]
    .filter((impression) => impression.inRange)
    .sort((a, b) => a.shownAt.getTime() - b.shownAt.getTime());
  for (const impression of flagOrder) {
    for (const { flag, outcome } of FLAG_OUTCOME) {
      if (!impression.flags[flag]) continue;
      const dedupe = `${mediaKey(impression.tmdbId, impression.mediaType)}|${outcome}`;
      if (counted.has(dedupe)) continue;
      ensure(impression.source)[outcome] += 1;
      counted.add(dedupe);
    }
  }

  const bySource = RECOMMENDATION_SOURCES.map((source) => flows.get(source))
    .filter((flow): flow is DiscoverySourceFlow => Boolean(flow))
    .filter((flow) => flow.impressions > 0 || OUTCOME_KEYS.some((key) => flow[key] > 0));

  const totals = emptyTotals();
  for (const flow of bySource) {
    totals.impressions += flow.impressions;
    for (const key of OUTCOME_KEYS) totals[key] += flow[key];
  }

  return { period, by_source: bySource, totals };
}
