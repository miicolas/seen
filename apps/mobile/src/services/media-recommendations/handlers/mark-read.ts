import { eden, unwrapEden } from "@/lib/eden";

export async function markRecommendationRead(recommendationId: string): Promise<{ ok: boolean }> {
  return unwrapEden<{ ok: boolean }>(eden["media-recommendations"][recommendationId].read.post());
}
