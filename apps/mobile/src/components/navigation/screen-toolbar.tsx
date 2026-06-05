import { Stack } from "expo-router";

import type { ScreenAction } from "./types";

interface ScreenToolbarProps {
  placement: "left" | "right";
  actions: ScreenAction[];
}

// Declarative header toolbar: pass a list of actions instead of hand-writing
// Stack.Toolbar.Button blocks at every call-site.
export function ScreenToolbar({ placement, actions }: ScreenToolbarProps) {
  return (
    <Stack.Toolbar placement={placement}>
      {actions.map((action) => (
        <Stack.Toolbar.Button
          key={action.key}
          icon={action.icon}
          onPress={action.onPress}
          tintColor={action.tintColor}
          disabled={action.disabled}
          hidden={action.hidden}>
          {action.label}
        </Stack.Toolbar.Button>
      ))}
    </Stack.Toolbar>
  );
}
