import { eden, unwrapEden } from "@/lib/eden";

export function approveFollowRequest(requestId: string): Promise<{ ok: boolean }> {
  return unwrapEden<{ ok: boolean }>(eden.social.requests[requestId].approve.post());
}
