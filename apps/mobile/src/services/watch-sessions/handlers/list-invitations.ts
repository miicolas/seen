import { eden, unwrapEden } from "@/lib/eden";

import type { WatchInvitation } from "../types";

export async function listWatchInvitations(): Promise<WatchInvitation[]> {
  return unwrapEden<WatchInvitation[]>(eden["watch-sessions"].invitations.get());
}
