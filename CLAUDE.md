# CLAUDE.md

<<<<<<< ours
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

**Seen** is an **iOS-only** app — a Letterboxd-style app. There is **no web target and no Android target** for now. Do not add web-only code, `.web.*` files, or Android-specific branches.

The UI is built **primarily with Expo UI + SwiftUI** (`@expo/ui/swift-ui`) to be fully native, falling back to plain React Native views only when no Expo UI equivalent exists.

## Critical: Expo SDK version & UI rules

This is an **Expo SDK 56** project (React Native 0.85, React 19.2). SDK 56 introduced breaking changes. **Read the exact versioned docs before writing any code** — do not rely on memory of older Expo APIs:

- Expo SDK: https://docs.expo.dev/versions/v56.0.0/
- Expo UI SwiftUI: https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/

**Mandatory:** when building or editing any UI, follow the rules in the **`expo-ui-swiftui` skill** (`.agents/skills/expo-ui-swiftui/SKILL.md`), which encode the required Expo UI conventions from https://codewithbeto.dev/blog/expo-ui-tips (e.g. always pass `matchContents` and an explicit `ignoreSafeArea` on `<Host>`, centralize component wrappers, use platform colors).

## Commands

Package manager is **bun** (`bun.lock`). Use `bunx`/`bun` rather than `npm`/`npx`.

- `bun start` / `bunx expo start` — start the Metro dev server (loads `.env.development`)
- `bun ios` — start targeting the iOS simulator (the only supported target)
- `bun run lint` — `expo lint` (ESLint)
- `bunx tsc --noEmit` — typecheck (strict mode is on)
- `bun run reset-project` — moves starter code aside and scaffolds a blank `app/` (rarely needed)

There is no test framework wired up.

## Environment / Backend

The app talks to the local Seen API, selected by environment file (loaded automatically by Expo):

- `.env.development` → local Bun/Elysia API (`bun run dev:api`) and local Postgres/Redis dependencies.
- `.env.production` → hosted API endpoint used for production builds.

Client-visible values use `EXPO_PUBLIC_*`; never put provider secrets or database credentials there.

**The backend is `apps/api`** — a Bun/Elysia service using Better Auth, Drizzle, Postgres, Redis, and S3. Database schema lives in `packages/db/drizzle/` and `packages/db/src/schema/`; generate and run migrations through the root `db:*` scripts. Provider secrets stay server-side in the API environment.

**Movie data** comes from TMDB via the API module in `apps/api/src/modules/tmdb/`, which proxies TMDB and keeps TMDB tokens server-side. Follow the **`tmdb` skill** for any TMDB work (search/discover/find/detail, images, auth, cache).

## Architecture

iOS-only Expo Router (file-based routing) app. Source lives under `src/` and is imported via the `@/*` alias (→ `src/*`), with `@/assets/*` → `assets/*`. Typed routes and the React Compiler are both enabled (`app.json` → `experiments`).

### Auth-gated navigation

Authentication state drives routing through a single context, not imperative redirects:

1. `src/lib/auth-client.ts` creates the Better Auth Expo client and configures secure client-side session storage.
2. `src/providers/auth-provider.tsx` reads the Better Auth session and exposes `{ session, user, isLoading, isLoggedIn }` via `AuthContext` (`src/hooks/use-auth-context.tsx`).
3. `src/app/_layout.tsx` reads `useAuthContext()` and uses **`<Stack.Protected guard={...}>`** to gate route groups: `(tabs)` when logged in, `(auth)/login` when not. Signing in/out flips `isLoggedIn` and the guard handles the redirect — screens should not navigate manually on auth change.
4. `src/components/splash-screen-controller.tsx` holds the native splash screen until `isLoading` is false (session restore finished).

When adding screens that require auth, place them under a group guarded in `_layout.tsx` rather than checking auth inside the screen.

### Screens vs routes

Route files under `src/app/` hold **no UI** — they only map a URL to a screen and own route-level concerns. The actual screen (UI + logic + `StyleSheet`) lives in a flat file **`src/components/screens/<screen>.tsx`** (kebab-case) as a **named export** with the bare feature name (`Home`, `Explore`, `Login` — not `*Screen`).

The route file is a thin default-export component that renders the screen:

```tsx
// src/app/(tabs)/index.tsx
import { Home } from '@/components/screens/home';

export default function HomeScreen() {
  return <Home />;
}
```

The wrapper (rather than a bare `export { default } from`) is deliberate: it lets the route add route-only config around the screen — e.g. `<Stack.Title>` / `<Stack.SearchBar>`, or wiring a route param into a store. When adding a screen: create `src/components/screens/<name>.tsx` exporting `export function <Name>()`, then add the thin route file under the appropriate (guarded) group in `src/app/`. Keep all components, hooks, and styles in the screen file, not the route.

### State management

Client state uses **Zustand**, split into small feature stores under `src/store/` (kebab-case `use-<feature>-store.ts`, actions suffixed `Action`). Persisted stores use the shared `expo-sqlite/kv-store` adapter in `src/store/storage.ts` (`createJSONStorage(() => Storage)`); transient UI/form state uses plain `create(...)` with no `persist`. See the **`state-management` skill** for the full conventions.

Boundary rule: **the API/database is the source of truth** for server data, and Better Auth owns the auth session. Zustand persistence is for client/UI state and offline cache only — never re-store auth sessions, tokens, or secrets in a Zustand store.

### Haptics

**Principal actions must give haptic feedback** (`expo-haptics`). Always go through the semantic helpers in `src/lib/haptics.ts` (`hapticTap`, `hapticSuccess`, `hapticError`, `hapticDelete`, `hapticSelection`, `hapticWarning`) — never call `expo-haptics` directly in components. Decide by intent: primary button/confirm → `hapticTap`; delete → `hapticDelete`; tab/page switch, toggle, picker → `hapticSelection`; async result → `hapticSuccess`/`hapticError`. Tab switches are already wired via `NativeTabs` `screenListeners` in `src/components/app-tabs.tsx`. Helpers are iOS-guarded and fire-and-forget; haptics don't fire on the simulator. See the **`haptics` skill**.

### Theming

- `src/constants/theme.ts` defines `Colors` (light/dark), `Fonts` (per-platform), and a `Spacing` scale (`half`=2 … `six`=64). Prefer `Spacing.*` tokens over raw pixel values.
- `useTheme()` (`src/hooks/use-theme.ts`) returns the active color set; `useColorScheme()` has a `.web` variant. Build UI with `ThemedText` / `ThemedView` and pass `themeColor`/`type` props instead of hardcoding colors.
- Tabs use the new `expo-router/unstable-native-tabs` (`NativeTabs`) in `src/components/app-tabs.tsx`.
- For the broader **design system** (design tokens, a Tailwind-style color palette with shades, and a `variant`/`color`/`size` component API via `useVariantConfig`), follow the **`design-system` skill**. Reusable components are **SwiftUI-first** (built on `@expo/ui/swift-ui`, per `expo-ui-swiftui`) but consume the shared tokens. Note: the design-system `SPACING` scale (`XS..XXL`) and `theme.ts`'s `Spacing` (`half..six`) overlap — pick one before scaling the UI up.

### Platform-specific files

The starter left behind some `*.web.tsx`/`*.web.ts` files (e.g. `app-tabs.web.tsx`, `animated-icon.web.tsx`, `use-color-scheme.web.ts`) plus `animated-icon.module.css`. Web is **not** a supported target — do not add new `.web.*` files and do not spend effort maintaining the existing ones. Prefer `.ios.tsx` platform extensions when a native-only variant is genuinely needed.

### Conventions

- **Naming is governed by the `naming` skill** (`.agents/skills/naming/SKILL.md`) — the single source of truth for which word to use per concept (`media`/`movie`/`tv`, `rating`/`review`, `profile`/`user`; `note` and `film` are banned) and where each kind of file lives. Read it before naming or renaming anything.
- Files are named **kebab-case**; the path alias `@/` is used for all internal imports.
- User-facing screen text is in **English**. (The legacy login screen is still in French and is being migrated.)
- Build UI with Expo UI SwiftUI per the `expo-ui-swiftui` skill; reach for plain RN views only when there's no native equivalent.
- Source layout under `src/`: `app/` (routes), `components/` (+ `components/ui/`), `hooks/`, `providers/`, `lib/`, `constants/`, and `store/` (Zustand). Add `types/` and `utils/` when those layers are introduced (typed API client, shared helpers).

### File structure & complexity (mandatory)

Follow the global **File structure & complexity** rules in `~/.claude/CLAUDE.md` (one unit per file, extract reusables, analyze before writing, no duplication, short/flat files, group siblings into folders). The codebase has accumulated files that are too long, complex, and duplicated — keep it small, flat, and DRY.

Seen-specific concretions of those rules:

- Files are **kebab-case**; a single primary export per file.
- Reusable UI/logic goes in `components/`, `components/ui/`, or `hooks/`.
- When a feature has 2+ siblings, co-locate them: several hooks → `hooks/<feature>/` (`use-*.ts`), a split screen → `components/screens/<screen>/` (with `index.tsx`), backend client code → `services/<feature>/handlers/`.
=======
This file is the Claude Code entry point for this repository.

@AGENTS.md

## Claude Code Notes

- Use the shared project instructions from `AGENTS.md` as the source of truth.
- Project skills are available through `.claude/skills`, which links to the same skill bodies used by Codex under `.agents/skills`.
- Keep Claude-specific settings in `.claude/settings.json` or `.claude/settings.local.json`; keep Codex-facing instructions and skills in `AGENTS.md`, `.agents/skills`, and `.codex/`.
>>>>>>> theirs
