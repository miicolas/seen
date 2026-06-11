import { eden, unwrapEden } from "@/lib/eden";

import type { WatchSessionDetail } from "../types";

export async function getWatchSessionDetail(sessionId: string): Promise<WatchSessionDetail> {
  return unwrapEden<WatchSessionDetail>(eden["watch-sessions"][sessionId].get());
}
