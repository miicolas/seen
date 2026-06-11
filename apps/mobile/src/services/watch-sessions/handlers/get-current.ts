import { eden, unwrapEden } from "@/lib/eden";

import type { WatchSession } from "../types";

export async function getCurrentWatchSession(): Promise<WatchSession | null> {
  return unwrapEden<WatchSession | null>(eden["watch-sessions"].current.get());
}
