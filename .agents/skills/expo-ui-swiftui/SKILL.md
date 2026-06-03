---
name: expo-ui-swiftui
description: Build native iOS UI in the Seen app with Expo UI + SwiftUI (@expo/ui/swift-ui). Use this skill whenever creating or editing any screen, component, or control in this project — Seen is iOS-only and the UI is built primarily with Expo UI SwiftUI, not plain React Native views. Triggers on building UI, screens, forms, buttons, lists, controls, Host components, layout, keyboard handling, platform colors, or styling for iOS.
---

# Expo UI + SwiftUI for Seen

**Seen is an iOS-only app** (a Letterboxd-style app). There is no web target and no Android target for now. Build the UI **primarily with Expo UI SwiftUI** (`@expo/ui/swift-ui`) so the interface is fully native, falling back to plain React Native views only when no Expo UI equivalent exists.

## Mandatory references — read before writing UI

1. **Expo UI SwiftUI docs (versioned):** https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/ — this is Expo SDK 56, APIs changed. Read the exact component/modifier signatures here; do not rely on memory.
2. **Code With Beto — Expo UI tips:** https://codewithbeto.dev/blog/expo-ui-tips — the six rules below are mandatory for this project. (Expo UI is still in beta; APIs may shift.)

## Imports

```tsx
import { Host, TextField, VStack, HStack, Form, Section, Picker, Slider } from "@expo/ui/swift-ui";
import { glassEffect, buttonStyle } from "@expo/ui/swift-ui/modifiers";
```

Install/upgrade with `bunx expo install @expo/ui` (this project uses bun).

## Core rule: everything lives inside `<Host>`

Think of `Host` as a window into a SwiftUI view. SwiftUI components from `@expo/ui/swift-ui` only work nested inside a `Host`. A regular React Native `View` placed directly inside a `Host` will break — use `RNHostView` for that (rule 3).

---

## The 6 mandatory rules

### 1. `ignoreSafeArea` on `Host`

By default the SwiftUI host performs its own keyboard avoidance, which fights your own keyboard handling (e.g. `react-native-keyboard-controller`) and leaves wrong gaps or makes content jump.

- `ignoreSafeArea="keyboard"` — stop the host's keyboard avoidance so **you** handle it. Use this whenever you do your own keyboard handling.
- `ignoreSafeArea="all"` — for elements that must never move when the keyboard opens/closes (e.g. a floating bottom-right button).

```tsx
<Host matchContents ignoreSafeArea="keyboard">
  {/* your SwiftUI content */}
</Host>
```

### 2. Always pass `matchContents`

`Host` is a window onto the SwiftUI view; without `matchContents` you must set `width`/`height` manually. Wrong size = touches don't register outside the window (too small) or wasted space/layout bugs (too big). `flex: 1` often doesn't work because SwiftUI views don't fill flex layouts. `matchContents` sizes the host exactly to its inner SwiftUI content.

```tsx
<Host matchContents>
  <TextField placeholder="Enter text" multiline />
</Host>
```

### 3. `RNHostView` — embed React Native inside SwiftUI

A `Host` only accepts native Expo UI components. When you need React Native primitives **inside** a SwiftUI tree (e.g. a live RN preview inside a SwiftUI `Form`), wrap them in `RNHostView` (also takes `matchContents`).

```tsx
<Host style={{ flex: 1 }}>
  <Form>
    <Section title="Preview">
      <RNHostView matchContents>
        <View style={{ paddingHorizontal: 30 }}>
          {/* React Native preview content */}
        </View>
      </RNHostView>
    </Section>
    <Section title="Appearance">
      <Picker label="Spacing" /* … */ />
      <Slider /* … */ />
    </Section>
  </Form>
</Host>
```

### 4. Platform extensions for components and routes

Importing the wrong platform's native components crashes the app. Even though Seen targets iOS only, **always keep at least one file without a platform extension as the default/fallback**, and put SwiftUI implementations in the default (or `.ios.tsx`) file. Share types via a `.types.ts` file:

```
components/generation/
  InputControls.tsx        # iOS (SwiftUI) — and the required default fallback
  InputControls.types.ts   # shared types/interfaces
```

Do **not** add `.web.tsx` files — there is no web target. (No `.android.tsx` needed either unless Android is added later.)

### 5. Centralize your API

Don't duplicate state, fetch logic, or tokens inside platform files. Lift shared logic into a context or hook that the UI consumes — treat it like a mini package. Define the contract once in the `.types.ts` file (props + an imperative handle interface used with `useImperativeHandle`):

```ts
// InputControls.types.ts
export interface InputControlsHandle {
  focus: () => void;
  blur: () => void;
  setText: (text: string) => void;
}
export interface InputControlsProps {
  prompt?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
}
```

Pull design tokens (spacing, radius, etc.) from a shared context rather than redefining them per component.

### 6. Use platform colors

Expo Router ships a `Color` utility for native, light/dark-adaptive system colors — prefer these over hand-rolled hex tokens for semantic surfaces/text/separators on iOS:

```tsx
import { Color } from "expo-router";

Color.ios.systemBackground;
Color.ios.secondarySystemBackground;
Color.ios.label;
Color.ios.secondaryLabel;
Color.ios.separator;
```

These adapt to light/dark automatically — no theme provider needed for basic system colors. For app-specific colors not covered by a system semantic color, reuse this project's `Colors`/`useTheme` tokens (`src/constants/theme.ts`).

---

## Project conventions to keep

- Files are **kebab-case**; import internal modules via the `@/` alias.
- User-facing text is in **French**.
- No web, no Android: never add `.web.*` files or web-only branches.
- Use `Spacing`/`useTheme()`/`ThemedText`/`ThemedView` from `src/constants/theme.ts` for anything not covered by native SwiftUI styling or `Color.ios.*`.
