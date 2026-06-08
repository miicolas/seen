import { eden, unwrapEden } from "@/lib/eden";

import type { Preferences } from "../types";

export function getMyPreferences(): Promise<Preferences> {
  return unwrapEden<Preferences>(eden.preferences.me.get());
}
