---
name: state-management
description: Zustand state-management conventions for the Seen app — feature-split stores, on-device persistence via expo-sqlite/kv-store, and the boundary with API-owned server state. Use this skill whenever creating, editing, or wiring client state: stores, global/shared state, persisted state, offline cache, form state, transient UI state, or anything involving zustand, create(), persist, or src/store/.
---

# State management (Zustand) for Seen

Seen uses **Zustand** for client state, with on-device persistence via **`expo-sqlite/kv-store`**. State is split into small **feature stores** under `src/store/`. This mirrors the reference app's pattern (Code With Beto / Endlessly).

## The boundary: Zustand vs server state (read first)

- **The API/database is the source of truth** for server data, and Better Auth owns the auth session.
- **Zustand persistence is for client/UI state and offline cache only.**
- **Never** store the auth session, access tokens, or anything secret in a Zustand store.
- For server data, fetch from the API; you may cache a copy in a Zustand store for offline/optimistic UI, but treat the API/database as authoritative on reconnect.

## Conventions

- **Location & naming:** one file per store in `src/store/`, kebab-case: `use-<feature>-store.ts` (e.g. `use-watchlist-store.ts`). (The reference app uses camelCase like `useStoryStore.ts`; in Seen always use kebab-case to match the project.)
- **Hook name:** `use<Feature>Store` (camelCase export), e.g. `useWatchlistStore`.
- **Actions:** suffix every action with `Action` — `addFilmAction`, `toggleFavoriteAction`, `clearAction`. Keep actions inside the store, derived from `set`/`get`.
- **Typed:** declare a `<Feature>Store` interface (state + actions) and pass it to `create`/`persist` as the generic.
- **Selectors:** subscribe to the narrowest slice to avoid re-renders — `useWatchlistStore((s) => s.films)`, not the whole store.

## Persisted store (survives app restart)

Use for user-facing client state worth keeping offline (watchlist, preferences, drafts, cached lists). Use the shared adapter from `src/store/storage.ts`:

```ts
import { Storage } from "@/store/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface WatchlistStore {
  films: Film[];
  addFilmAction: (film: Film) => void;
  removeFilmAction: (id: string) => void;
  clearAction: () => void;
}

export const useWatchlistStore = create(
  persist<WatchlistStore>(
    (set) => ({
      films: [],
      addFilmAction: (film) => set((s) => ({ films: [...s.films, film] })),
      removeFilmAction: (id) =>
        set((s) => ({ films: s.films.filter((f) => f.id !== id) })),
      clearAction: () => set({ films: [] }),
    }),
    { name: "watchlist-store", storage: createJSONStorage(() => Storage) },
  ),
);
```

- `name` is the storage key — keep it unique and kebab-case.
- Use `partialize` to persist only part of the state, and `version` + `migrate` when the shape changes.

## Ephemeral store (in-memory only)

Use for transient/UI state that should reset on restart — form-in-progress, modal/sheet state, players, progress. **No `persist`:**

```ts
import { create } from "zustand";

interface ComposerStore {
  query: string;
  setQueryAction: (query: string) => void;
  resetAction: () => void;
}

export const useComposerStore = create<ComposerStore>((set) => ({
  query: "",
  setQueryAction: (query) => set({ query }),
  resetAction: () => set({ query: "" }),
}));
```

## Decision guide

| State | Store type |
| --- | --- |
| Watchlist, favorites, user preferences, offline cache of server data | **persisted** |
| Form/composer in progress, search query, modal/sheet open, playback progress | **ephemeral** |
| Auth session / tokens | **neither — Better Auth secure storage** |
| Source-of-truth server data | **fetch from the API** (optionally cache in a persisted store) |

## Don'ts

- Don't put a Zustand provider around the app — Zustand stores are global module singletons; just import the hook.
- Don't read the whole store when you need one field (causes extra re-renders).
- Don't duplicate the auth session into Zustand.
