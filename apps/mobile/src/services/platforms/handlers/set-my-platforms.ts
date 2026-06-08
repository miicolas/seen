import { eden, unwrapEden } from "@/lib/eden";

import type { SetUserPlatformsInput, UserPlatforms } from "../types";

export function setMyPlatforms(input: SetUserPlatformsInput): Promise<UserPlatforms> {
  return unwrapEden<UserPlatforms>(eden.platforms.me.put(input));
}
