import { eden, unwrapEden } from "@/lib/eden";

import type { WatchSession } from "../types";

export async function acceptWatchInvitation(
  invitationId: string,
  fromBeginning: boolean,
): Promise<WatchSession> {
  return unwrapEden<WatchSession>(
    eden["watch-sessions"].invitations[invitationId].accept.post({
      from_beginning: fromBeginning,
    }),
  );
}
