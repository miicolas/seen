import { eden, unwrapEden } from "@/lib/eden";

import type { Preferences, PreferencesInput } from "../types";

export function setPreferences(input: PreferencesInput): Promise<Preferences> {
  return unwrapEden<Preferences>(eden.preferences.me.put(input));
}
