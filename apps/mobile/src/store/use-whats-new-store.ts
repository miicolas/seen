import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Storage } from "@/store/storage";

interface WhatsNewStore {
  lastSeenVersion: string | null;
  setLastSeenVersionAction: (version: string) => void;
}

export const useWhatsNewStore = create(
  persist<WhatsNewStore>(
    (set) => ({
      lastSeenVersion: null,
      setLastSeenVersionAction: (version) => set({ lastSeenVersion: version }),
    }),
    {
      name: "whats-new-store",
      storage: createJSONStorage(() => Storage),
    },
  ),
);
