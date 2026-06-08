import { Stack } from "expo-router";

import type { ScreenAction } from "./types";

interface ScreenToolbarProps {
  placement: "left" | "right";
  actions: ScreenAction[];
}

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
