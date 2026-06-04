import { eden, unwrapEden } from "@/lib/eden";

export function revokeSession(token: string): Promise<{ ok: boolean }> {
  return unwrapEden<{ ok: boolean }>(
    eden.account.sessions.revoke.post({ token }),
  );
}
