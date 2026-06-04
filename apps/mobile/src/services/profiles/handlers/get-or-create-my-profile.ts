import { eden, unwrapEden } from "@/lib/eden";

import type { Profile } from "../types";

export function getOrCreateMyProfile(): Promise<Profile> {
  return unwrapEden<Profile>(eden.profiles.me.get());
}
