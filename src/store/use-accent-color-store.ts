import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Storage } from "@/store/storage";
import type { UIColor } from "@/types/ui";

// User-selectable accent color family (e.g. "indigo", "violet"). `null` falls
// back to the app's default accent. Persisted so the choice survives restarts.
// This is client/UI state only — see the `state-management` skill.
interface AccentColorStore {
  accentColorFamily: UIColor | null;
  setAccentColorFamilyAction: (family: UIColor | null) => void;
}

export const useAccentColorStore = create(
  persist<AccentColorStore>(
    (set) => ({
      accentColorFamily: null,
      setAccentColorFamilyAction: (family) =>
        set({ accentColorFamily: family }),
    }),
    {
      name: "accent-color-store",
      storage: createJSONStorage(() => Storage),
    },
  ),
);
