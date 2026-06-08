import { eden, unwrapEden } from "@/lib/eden";

import type { SeedItem } from "../types";

export function getOnboardingSeed(): Promise<SeedItem[]> {
  return unwrapEden<SeedItem[]>(eden.preferences["onboarding-seed"].get());
}
