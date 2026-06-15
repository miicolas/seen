import { eden, unwrapEden } from "@/lib/eden";

import type { RecommendationProfileCard } from "../types";

export async function listRecommendableFriends(): Promise<RecommendationProfileCard[]> {
  return unwrapEden<RecommendationProfileCard[]>(
    eden["media-recommendations"]["recommendable-friends"].get(),
  );
}
