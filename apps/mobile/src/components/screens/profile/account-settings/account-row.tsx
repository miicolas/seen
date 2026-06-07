import { Button, Label } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import type { SFSymbol } from "sf-symbols-typescript";

import { useTheme } from "@/hooks/use-theme";

interface AccountRowProps {
  icon: SFSymbol;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}

// A settings row. The icon color comes from the parent Form's `tint` (the app
// accent) — a Form Button's local tint only colors the label, not the SF Symbol.
// So here the label is tinted to the primary text color while the Form keeps the
// accent on the icon; destructive rows stay fully red via `role`.
export function AccountRow({ icon, label, onPress, destructive }: AccountRowProps) {
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
