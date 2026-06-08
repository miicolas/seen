import { eden, unwrapEden } from "@/lib/eden";

import type { FollowRequest } from "../types";

export function getFollowRequests({
  limit = 30,
  offset = 0,
}: { limit?: number; offset?: number } = {}): Promise<FollowRequest[]> {
  return unwrapEden<FollowRequest[]>(eden.social.requests.get({ query: { limit, offset } }));
}
