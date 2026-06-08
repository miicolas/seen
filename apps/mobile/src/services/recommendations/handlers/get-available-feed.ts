import { eden, unwrapEden } from "@/lib/eden";

import type { AvailableEntry, AvailableFeedQuery } from "../types";

export function getAvailableFeed({
  region,
  filter = "all",
}: AvailableFeedQuery): Promise<AvailableEntry[]> {
  return unwrapEden<AvailableEntry[]>(
    eden.recommendations.available.get({
      query: { region, filter },
    }),
  );
}
