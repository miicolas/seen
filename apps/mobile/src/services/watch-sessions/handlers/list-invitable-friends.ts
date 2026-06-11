import { eden, unwrapEden } from "@/lib/eden";

import type { WatchProfileCard } from "../types";

export async function listInvitableFriends(sessionId: string): Promise<WatchProfileCard[]> {
  return unwrapEden<WatchProfileCard[]>(
    eden["watch-sessions"][sessionId]["invitable-friends"].get(),
  );
}
