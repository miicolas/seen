import { eden, unwrapEden } from "@/lib/eden";

import type { FeedQuery, FeedResponse } from "../types";

export function getFeed({ region }: FeedQuery): Promise<FeedResponse> {
  return unwrapEden<FeedResponse>(
    eden.recommendations.feed.get({
      query: { region },
    }),
  );
}
