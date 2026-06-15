import { eden, unwrapEden } from "@/lib/eden";

export async function getUnreadRecommendationsCount(): Promise<{ count: number }> {
  return unwrapEden<{ count: number }>(eden["media-recommendations"]["unread-count"].get());
}
