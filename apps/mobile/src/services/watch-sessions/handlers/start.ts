import { eden, unwrapEden } from "@/lib/eden";

import type { StartWatchSessionInput, WatchSession } from "../types";

export async function startWatchSession(input: StartWatchSessionInput): Promise<WatchSession> {
  return unwrapEden<WatchSession>(eden["watch-sessions"].post(input));
}
