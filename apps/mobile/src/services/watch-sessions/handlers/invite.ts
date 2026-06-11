import { eden, unwrapEden } from "@/lib/eden";

import type { WatchInvitation } from "../types";

export async function inviteToWatchSession(
  sessionId: string,
  inviteeId: string,
): Promise<WatchInvitation> {
  return unwrapEden<WatchInvitation>(
    eden["watch-sessions"][sessionId].invitations.post({ invitee_id: inviteeId }),
  );
}
