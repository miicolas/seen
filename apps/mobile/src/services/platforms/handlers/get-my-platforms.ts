import { eden, unwrapEden } from "@/lib/eden";

import type { UserPlatforms } from "../types";

export function getMyPlatforms(region: string): Promise<UserPlatforms> {
  return unwrapEden<UserPlatforms>(eden.platforms.me.get({ query: { region } }));
}
