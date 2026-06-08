import { eden, unwrapEden } from "@/lib/eden";

import type { PrivacyInput, Profile } from "../types";

export function updateMyPrivacy(input: PrivacyInput): Promise<Profile> {
  return unwrapEden<Profile>(eden.profiles.me.privacy.patch(input));
}
