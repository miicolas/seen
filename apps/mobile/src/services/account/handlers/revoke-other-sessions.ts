import { eden, unwrapEden } from "@/lib/eden";

export function revokeOtherSessions(): Promise<{ ok: boolean }> {
  return unwrapEden<{ ok: boolean }>(
    eden.account.sessions["revoke-others"].post(),
  );
}
