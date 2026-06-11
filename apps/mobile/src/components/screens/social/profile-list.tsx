import { Host, List } from "@expo/ui/swift-ui";
import { listStyle, scrollContentBackground } from "@expo/ui/swift-ui/modifiers";

import { useTheme } from "@/hooks/use-theme";

// The native inset list shared by the social screens (search, requests,
// connections). Children are list rows / sections — see ProfileListRow.
export function ProfileList({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <Host style={{ flex: 1, backgroundColor: theme.background }}>
      <List modifiers={[listStyle("inset"), scrollContentBackground("hidden")]}>{children}</List>
    </Host>
  );
}
