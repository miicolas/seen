import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Storage } from "@/store/storage";

type OnboardingStepStatus = "pending" | "skipped" | "completed";

interface OnboardingStore {
  // Whether the user has been through (or skipped) the post-sign-up setup step.
  // Client UI state only — never auth/session data.
  completed: boolean;
  // Flips true once the persisted value has loaded, so the root navigator doesn't
  // flash the setup step before we know whether it was already completed.
  hasHydrated: boolean;
  letterboxdImportStatus: OnboardingStepStatus;
  platformsStatus: OnboardingStepStatus;
  completeOnboardingAction: () => void;
  markLetterboxdImportSkippedAction: () => void;
  markLetterboxdImportCompletedAction: () => void;
  markPlatformsSkippedAction: () => void;
  markPlatformsCompletedAction: () => void;
  setHasHydratedAction: (value: boolean) => void;
}

export const useOnboardingStore = create(
  persist<OnboardingStore>(
    (set) => ({
      completed: false,
      hasHydrated: false,
      letterboxdImportStatus: "pending",
      platformsStatus: "pending",
      completeOnboardingAction: () => set({ completed: true }),
      markLetterboxdImportSkippedAction: () => set({ letterboxdImportStatus: "skipped" }),
      markLetterboxdImportCompletedAction: () => set({ letterboxdImportStatus: "completed" }),
      markPlatformsSkippedAction: () => set({ platformsStatus: "skipped" }),
      markPlatformsCompletedAction: () => set({ platformsStatus: "completed" }),
      setHasHydratedAction: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "onboarding-store",
      storage: createJSONStorage(() => Storage),
      onRehydrateStorage: () => (state) => state?.setHasHydratedAction(true),
    },
  ),
);
