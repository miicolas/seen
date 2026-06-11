import type { SeedItem } from "@/services/preferences";

export function cardKey(card: Pick<SeedItem, "id" | "media_type">): string {
  return `${card.media_type}:${card.id}`;
}

// Splices a fresh adaptive batch into the queue right after the cards the user
// is about to see, pushing the displaced probes back and trimming to capacity.
export function mergeAdaptiveCards(args: {
  queue: SeedItem[];
  fresh: SeedItem[];
  keepAhead: number;
  capacity: number;
  excludeKeys: Set<string>;
}): SeedItem[] {
  const { queue, fresh, keepAhead, capacity, excludeKeys } = args;

  const seen = new Set(excludeKeys);
  const incoming: SeedItem[] = [];
  for (const card of fresh) {
    const key = cardKey(card);
    if (seen.has(key)) continue;
    seen.add(key);
    incoming.push(card);
  }
  if (incoming.length === 0) return queue;

  return [...queue.slice(0, keepAhead), ...incoming, ...queue.slice(keepAhead)].slice(0, capacity);
}
