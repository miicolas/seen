import { eden, unwrapEden } from "@/lib/eden";

export async function declineWatchInvitation(invitationId: string): Promise<{ ok: boolean }> {
  return unwrapEden<{ ok: boolean }>(
    eden["watch-sessions"].invitations[invitationId].decline.post({}),
  );
}
