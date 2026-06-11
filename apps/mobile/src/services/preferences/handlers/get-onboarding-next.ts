import { eden, unwrapEden } from "@/lib/eden";

import type { OnboardingNextRequest, SeedItem } from "../types";

export function getOnboardingNext(input: OnboardingNextRequest): Promise<SeedItem[]> {
  return unwrapEden<SeedItem[]>(eden.preferences["onboarding-next"].post(input));
}
