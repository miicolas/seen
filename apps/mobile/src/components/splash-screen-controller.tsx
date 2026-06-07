import { useAuthContext } from "@/hooks/use-auth-context";
import { SplashScreen } from "expo-router";

import { useOnboardingStore } from "@/store/use-onboarding-store";

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading } = useAuthContext();
  // Wait for the persisted onboarding flag too, so the navigator doesn't flash the
  // setup step before we know it was already completed.
  const hasHydrated = useOnboardingStore((state) => state.hasHydrated);

  if (!isLoading && hasHydrated) {
    SplashScreen.hideAsync();
  }

  return null;
}
