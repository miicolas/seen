import { Stack } from "expo-router";

import type { LabeledMediaFilterOption } from "@/hooks/use-media-filter";
import type { MediaFilter } from "@/lib/tmdb";

// Right-side nav-bar menu for the all/movie/tv media filter, shared by the
// Discover and Watchlist screens. Pairs with the `useMediaFilter` hook.
export function MediaFilterToolbar({
  filter,
  options,
  onSelect,
}: {
  filter: MediaFilter;
  options: LabeledMediaFilterOption[];
  onSelect: (value: MediaFilter) => void;
}) {
  const activeOption = options.find((option) => option.value === filter) ?? options[0];

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu icon={activeOption.icon}>
        <Stack.Toolbar.Label>{activeOption.label}</Stack.Toolbar.Label>
        {options.map((option) => (
          <Stack.Toolbar.MenuAction
            key={option.value}
            icon={option.icon}
            isOn={filter === option.value}
            onPress={() => onSelect(option.value)}>
            {option.label}
          </Stack.Toolbar.MenuAction>
        ))}
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}
