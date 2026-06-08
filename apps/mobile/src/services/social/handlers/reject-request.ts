import { eden, unwrapEden } from "@/lib/eden";

export function rejectFollowRequest(requestId: string): Promise<{ ok: boolean }> {
  return unwrapEden<{ ok: boolean }>(eden.social.requests[requestId].reject.post());
}
