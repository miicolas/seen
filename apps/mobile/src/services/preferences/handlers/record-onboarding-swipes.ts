import { eden, unwrapEden } from "@/lib/eden";

import type { OnboardingSwipe, OnboardingSwipeResult } from "../types";

export function recordOnboardingSwipes(items: OnboardingSwipe[]): Promise<OnboardingSwipeResult> {
  return unwrapEden<OnboardingSwipeResult>(eden.preferences["onboarding-swipes"].post({ items }));
}
