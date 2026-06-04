import type { ColorValue } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

// A single header toolbar action (close, save, submit…). Rendered as a native
// Stack.Toolbar.Button by ScreenToolbar.
export type ScreenAction = {
  key: string;
  icon: SFSymbol;
  onPress: () => void;
  /** Accessibility label (the visible content is the icon). */
  label?: string;
  tintColor?: ColorValue;
  disabled?: boolean;
  hidden?: boolean;
};
