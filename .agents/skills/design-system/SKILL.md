---
name: design-system
description: Design-system conventions for the Seen app — design tokens (spacing, font sizes, radii, durations, z-index), a Tailwind-style color palette with shades, and a variant/size/color component API (useVariantConfig). Crucially SwiftUI-first: components are built on @expo/ui/swift-ui, not RN StyleSheet. Use when defining tokens, building reusable UI components, theming, accent colors, button/text/card/input variants, or deciding spacing/typography/color values.
---

# Design system for Seen

Seen's design system ports the token + variant model from the reference app (Code With Beto / Endlessly), **but components are built SwiftUI-first** with `@expo/ui/swift-ui` — not plain React Native `StyleSheet`. Tokens provide the values; SwiftUI renders them.

> Always pair this with the **`expo-ui-swiftui`** skill — it defines the `Host`/`matchContents`/`ignoreSafeArea` rules every component must follow. This skill covers *what values/variants to use*; that skill covers *how to host SwiftUI*.

## Relationship to the existing `theme.ts`

`src/constants/theme.ts` already defines `Colors` (light/dark), `Fonts`, and a small `Spacing` scale (`half`=2 … `six`=64). The design system **extends** this:

- ⚠️ **Spacing scale conflict to resolve:** the existing `Spacing` uses `half/one/two…six`; the reference token set uses `XS/SM/MD/LG/XL/XXL` (4/8/16/32/48/64). **Pick one convention before scaling up.** Recommended: migrate to the named `SPACING` scale below (it's the one the variant system and reference components assume) and update the few existing usages, or keep `theme.ts.Spacing` and translate. Do not run both indefinitely.
- Prefer native semantic colors (`Color.ios.*` from `expo-router`, per the `expo-ui-swiftui` skill) for system surfaces/text; use the palette below for brand/accent colors.

## Design tokens (`src/constants/design-tokens.ts`)

Port the reference token set (kebab-case filename). Tokens eliminate magic numbers and give semantic names. The full set:

- `SPACING` — `NONE 0, XXS 1, XS 4, SM 8, MD 16, LG 32, XL 48, XXL 64`
- `FONT_SIZE` — `XS 12 … MD 16 (body) … TITLE 32 … DISPLAY 96 …`
- `LINE_HEIGHT` — paired with `FONT_SIZE`
- `COMPONENT_HEIGHT` — `XS 28, SM 36, MD 48, LG 56, XL 64, XXL 72`
- `BORDER_RADIUS` — `NONE 0, SM 8, MD 16, LG 24, FULL 9999`
- `BORDER_WIDTH` — `NONE 0, THIN 1, MEDIUM 2, THICK 3`
- `OPACITY` — disabled/pressed/muted + hex opacity suffixes for soft backgrounds
- `DURATION` — `QUICK 150, FAST 300, NORMAL 500, SLOW/LOADING/SPLASH 1000`
- `Z_INDEX` — `BASE 0, CONTENT 1, OVERLAY 2, BLUR 3, MODAL 10, TOOLTIP 20, DROPDOWN 30`
- `COLOR_SHADES` / `THEME_SHADES` — semantic shade aliases (LIGHTEST 50 … DARKEST 950)

## Color palette (`src/constants/colors.ts`)

Tailwind-style palette: color families (slate, zinc, gray, red, blue, indigo, violet, …) each with shades `50` (lightest) → `950` (darkest). Access via a `getColorValue(family, shade)` helper. This is the brand/accent layer; `theme.ts` stays the light/dark semantic layer.

## Variant system (`src/hooks/use-variant-config.ts`)

Reusable components take `variant` + `color` + `size` + `radius` props. `useVariantConfig(color, { supportedVariants, includePlaceholderColor })` returns, per variant, `{ backgroundColor, borderColor, textColor, borderWidth }` resolved for the active color scheme and accent color.

Variants: `solid | outline | soft | subtle | link | underline`

- `solid` — filled bg, contrast text
- `outline` — transparent bg, colored border + text
- `soft` / `subtle` — translucent bg (uses `OPACITY` hex suffixes), `subtle` adds a border
- `link` / `underline` — text-only (underline adds a rule)

Drive the default color from an **accent-color** hook/store (light/dark aware, optionally user-selectable and persisted via a Zustand store — see the `state-management` skill).

## Building a component (SwiftUI-first)

Components consume tokens + variant config, but render with `@expo/ui/swift-ui` inside a `Host`:

```tsx
import { Host, Button as UIButton } from "@expo/ui/swift-ui";
import { useVariantConfig } from "@/hooks/use-variant-config";
import { COMPONENT_HEIGHT, BORDER_RADIUS } from "@/constants/design-tokens";

export function Button({ title, onPress, variant = "solid", color, size = "md" }: ButtonProps) {
  const variants = useVariantConfig(color, { supportedVariants: ["solid", "outline", "soft", "subtle", "link"] });
  const cfg = variants[variant];
  // map cfg + tokens onto the SwiftUI Button / modifiers
  return (
    <Host matchContents>
      <UIButton onPress={onPress} /* apply cfg colors, COMPONENT_HEIGHT[size], BORDER_RADIUS via modifiers */>
        {title}
      </UIButton>
    </Host>
  );
}
```

- Define prop union types (`UIColor`, `UISize`, `UIRadius`, variants) in `src/types/ui.ts`.
- Keep components in `src/components/ui/` (kebab-case files), screens compose them.
- No `.web.*` / `.android.*` — Seen is iOS-only.

## Don'ts

- Don't hardcode pixel/hex values in components — reference tokens / palette / `Color.ios.*`.
- Don't build the component library on RN `StyleSheet` (the reference app does; Seen is SwiftUI-first).
- Don't leave two competing spacing scales — resolve the `theme.ts` vs `SPACING` conflict.
