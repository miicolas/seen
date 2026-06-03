import { useAuthContext } from "@/hooks/use-auth-context";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { SplashScreen } from "expo-router";

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading } = useAuthContext();
  // Wait for the persisted onboarding flag to hydrate, otherwise a returning
  // (already-onboarded) user would briefly see the welcome screen flash.
  const hasHydrated = useOnboardingStore((s) => s._hasHydrated);

  if (!isLoading && hasHydrated) {
    SplashScreen.hideAsync();
  }

  return null;
}
