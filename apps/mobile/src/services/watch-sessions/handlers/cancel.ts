import { eden, unwrapEden } from "@/lib/eden";

export async function cancelWatchSession(sessionId: string): Promise<{ ok: boolean }> {
  return unwrapEden<{ ok: boolean }>(eden["watch-sessions"][sessionId].cancel.post({}));
}
