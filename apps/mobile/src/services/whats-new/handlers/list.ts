import { eden, unwrapEden } from "@/lib/eden";

import type { WhatsNewRelease } from "../types";

export function getWhatsNewReleases(): Promise<WhatsNewRelease[]> {
  return unwrapEden<WhatsNewRelease[]>(eden["whats-new"].get());
}
