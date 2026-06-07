import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Storage } from "@/store/storage";

interface WhatsNewStore {
  // null = never initialized (first launch / fresh install).
  seenIds: string[] | null;
  markSeenAction: (ids: string[]) => void;
}

export const useWhatsNewStore = create(
  persist<WhatsNewStore>(
    (set) => ({
      seenIds: null,
      markSeenAction: (ids) =>
        set((state) => ({
          seenIds: Array.from(new Set([...(state.seenIds ?? []), ...ids])),
        })),
    }),
    {
      name: "whats-new-store",
      storage: createJSONStorage(() => Storage),
    },
  ),
);
