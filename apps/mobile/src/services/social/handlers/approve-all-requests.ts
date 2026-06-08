import { eden, unwrapEden } from "@/lib/eden";

export function approveAllFollowRequests(): Promise<{ approved: number }> {
  return unwrapEden<{ approved: number }>(eden.social.requests["approve-all"].post());
}
