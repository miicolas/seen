---
name: haptics
description: Haptic feedback conventions for the Seen app (expo-haptics). Principal user actions MUST give haptic feedback — button validation/confirm, deletion, tab/page switches, selections, toggles, success/error of async actions. Use this skill whenever adding or reviewing interactive actions, buttons, destructive actions, tab navigation, form submits, switches, or pickers. Always go through the semantic helpers in src/lib/haptics.ts, never call expo-haptics directly.
---

# Haptics for Seen

Seen must feel native. **Every principal action gives haptic feedback** via the semantic helpers in `src/lib/haptics.ts` — never call `expo-haptics` directly in components, and never decide by waveform; decide by **intent**.

Based on https://docs.expo.dev/versions/latest/sdk/haptics/ and https://codewithbeto.dev/blog/haptic-feedback-expo-router-native-tabs.

## Helpers (`@/lib/haptics`)

| Helper | Intent | Underlying API |
| --- | --- | --- |
| `hapticTap(style?)` | primary button press / confirm tap | `impactAsync(Light)` (override style if needed) |
| `hapticSuccess()` | async action succeeded (login, save, create) | `notificationAsync(Success)` |
| `hapticError()` | async action failed / validation error | `notificationAsync(Error)` |
| `hapticWarning()` | cautionary, needs attention (not a hard fail) | `notificationAsync(Warning)` |
| `hapticDelete()` | destructive action (delete/remove) | `impactAsync(Heavy)` |
| `hapticSelection()` | discrete value change: tab/page switch, segmented control, picker, toggle | `selectionAsync()` |

All helpers are **iOS-guarded** (`process.env.EXPO_OS === 'ios'`) and **fire-and-forget** — call them, don't `await`.

## Where haptics are REQUIRED

- **Primary buttons / confirms** → `hapticTap()` on press.
- **Destructive actions** (delete, remove, sign out of data) → `hapticDelete()`.
- **Tab / page switches** → `hapticSelection()` (already wired on `NativeTabs` via `screenListeners={{ tabPress }}` in `src/components/app-tabs.tsx`).
- **Selections / toggles / pickers / segmented controls** → `hapticSelection()`.
- **Async action result** (form submit, network mutation) → `hapticSuccess()` on success, `hapticError()` on failure.

## Patterns

Button press:

```tsx
import { hapticTap } from "@/lib/haptics";

<Pressable onPress={() => { hapticTap(); onConfirm(); }} />
```

Async success/error:

```tsx
const { error } = await authClient.signIn.email(creds);
if (error) hapticError();
else hapticSuccess();
```

Native tabs (already applied):

```tsx
<NativeTabs screenListeners={{ tabPress: () => hapticSelection() }}>
```

Destructive:

```tsx
import { hapticDelete } from "@/lib/haptics";
<Pressable onPress={() => { hapticDelete(); removeItemAction(id); }} />
```

## Rules

- Go through `@/lib/haptics`; don't import `expo-haptics` in components. If a one-off waveform is genuinely needed, the helper file re-exports `Haptics`.
- One haptic per user intent — don't stack (e.g. don't fire `hapticTap` AND `hapticSuccess` for the same tap; the tap confirms press, success confirms the result).
- Reserve `notification*` (success/warning/error) for **outcomes**, `impact`/`selection` for **interactions**.
- Don't over-haptic: avoid feedback on scroll, passive/idle changes, or non-interactive UI.
- Haptics don't fire on the iOS **simulator** — verify on a physical device.
