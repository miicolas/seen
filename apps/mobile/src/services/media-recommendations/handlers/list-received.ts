import { eden, unwrapEden } from "@/lib/eden";

import type { ReceivedRecommendation } from "../types";

export async function listReceivedRecommendations(): Promise<ReceivedRecommendation[]> {
  return unwrapEden<ReceivedRecommendation[]>(eden["media-recommendations"].received.get());
}
