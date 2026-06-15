import { eden, unwrapEden } from "@/lib/eden";

import type { SendRecommendationInput } from "../types";

export async function sendRecommendation(
  input: SendRecommendationInput,
): Promise<{ ok: boolean; count: number }> {
  return unwrapEden<{ ok: boolean; count: number }>(eden["media-recommendations"].post(input));
}
