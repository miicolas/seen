import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { useWhatsNew } from "@/components/screens/whats-new/use-whats-new";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { useWhatsNewStore } from "@/store/use-whats-new-store";

export function WhatsNewGate() {
  const router = useRouter();
  const { isLoading, isLoggedIn } = useAuthContext();
  const onboardingCompleted = useOnboardingStore((state) => state.completed);
  const { release, isFirstRun, shouldAutoShow, markSeen } = useWhatsNew();
  const [hydrated, setHydrated] = useState(() => useWhatsNewStore.persist.hasHydrated());
  const handled = useRef(false);

  useEffect(() => {
    if (hydrated) return;
    return useWhatsNewStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  useEffect(() => {
    if (handled.current || !hydrated || isLoading || !isLoggedIn || !onboardingCompleted) return;
    handled.current = true;

    if (isFirstRun) {
      if (release) markSeen();
      return;
    }

    if (!shouldAutoShow) return;

    const id = setTimeout(() => router.push("/whats-new"), 350);
    return () => clearTimeout(id);
  }, [
    hydrated,
    isLoading,
    isLoggedIn,
    onboardingCompleted,
    isFirstRun,
    shouldAutoShow,
    release,
    markSeen,
    router,
  ]);

  return null;
}
