import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { useWhatsNew } from "@/components/screens/whats-new/use-whats-new";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { useWhatsNewStore } from "@/store/use-whats-new-store";

export function WhatsNewGate() {
  const router = useRouter();
  const { isLoading: authLoading, isLoggedIn } = useAuthContext();
  const onboardingCompleted = useOnboardingStore((state) => state.completed);
  const { shouldAutoShow, isLoading } = useWhatsNew();
  const [hydrated, setHydrated] = useState(() => useWhatsNewStore.persist.hasHydrated());
  const handled = useRef(false);

  useEffect(() => {
    if (hydrated) return;
    return useWhatsNewStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  useEffect(() => {
    if (
      handled.current ||
      !hydrated ||
      isLoading ||
      authLoading ||
      !isLoggedIn ||
      !onboardingCompleted
    )
      return;
    handled.current = true;

    if (!shouldAutoShow) return;

    const id = setTimeout(() => router.push("/whats-new"), 350);
    return () => clearTimeout(id);
  }, [hydrated, isLoading, authLoading, isLoggedIn, onboardingCompleted, shouldAutoShow, router]);

  return null;
}
