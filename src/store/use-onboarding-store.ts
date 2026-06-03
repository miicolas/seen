import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Storage } from "@/store/storage";

// Tracks whether the user has already seen the welcome/onboarding screen.
// Persisted so the welcome screen only ever shows once (on the very first
// launch), then never again — even after signing out. See the routing guards
// in `src/app/_layout.tsx`.
interface OnboardingStore {
  hasSeenOnboarding: boolean;
  // True once the persisted value has been read back from storage. Used by the
  // splash controller to avoid flashing the onboarding before hydration.
  _hasHydrated: boolean;
  markSeenAction: () => void;
  setHydratedAction: (value: boolean) => void;
}

export const useOnboardingStore = create(
  persist<OnboardingStore>(
    (set) => ({
      hasSeenOnboarding: false,
      _hasHydrated: false,
      markSeenAction: () => set({ hasSeenOnboarding: true }),
      setHydratedAction: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "onboarding-store",
      storage: createJSONStorage(() => Storage),
      partialize: (state) =>
        ({ hasSeenOnboarding: state.hasSeenOnboarding }) as OnboardingStore,
      onRehydrateStorage: () => (state) => state?.setHydratedAction(true),
    },
  ),
);
