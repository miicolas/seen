import { eden, unwrapEden } from "@/lib/eden";

import type { PlatformProvider } from "../types";

export function listProviders(region: string): Promise<PlatformProvider[]> {
  return unwrapEden<PlatformProvider[]>(eden.platforms.providers.get({ query: { region } }));
}
