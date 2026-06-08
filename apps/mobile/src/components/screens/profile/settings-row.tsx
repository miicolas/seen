import { Button, Label } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import type { SFSymbol } from "sf-symbols-typescript";

import { useTheme } from "@/hooks/use-theme";

interface SettingsRowProps {
  icon: SFSymbol;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}

// A native settings row. The icon color comes from the parent Form's `tint`
// while non-destructive labels use the primary text color.
export function SettingsRow({ icon, label, onPress, destructive }: SettingsRowProps) {
  const theme = useTheme();

  if (destructive) {
    return <Button role="destructive" systemImage={icon} label={label} onPress={onPress} />;
  }

  if (!onPress) {
    return <Label systemImage={icon} title={label} />;
  }

  return (
    <Button systemImage={icon} label={label} onPress={onPress} modifiers={[tint(theme.text)]} />
  );
}
