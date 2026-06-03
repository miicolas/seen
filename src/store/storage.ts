// Shared persistence adapter for Zustand stores.
//
// Backed by expo-sqlite's key/value store (on-device SQLite). Use it with
// zustand's `persist` middleware for client/UI state that should survive
// app restarts:
//
//   import { create } from 'zustand';
//   import { createJSONStorage, persist } from 'zustand/middleware';
//   import { Storage } from '@/store/storage';
//
//   export const useExampleStore = create(
//     persist<ExampleStore>(
//       (set) => ({ ...state, ...actions }),
//       { name: 'example-store', storage: createJSONStorage(() => Storage) },
//     ),
//   );
//
// IMPORTANT: Supabase is the source of truth for server data and owns the auth
// session (persisted by LargeSecureStore in `@/lib/supabase`). Never persist the
// auth session in a Zustand store — keep this for UI state and offline cache only.
export { default as Storage } from "expo-sqlite/kv-store";
