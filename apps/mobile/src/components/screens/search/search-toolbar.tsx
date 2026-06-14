import { Stack } from "expo-router";
import type { ColorValue } from "react-native";

import type { LabeledMediaFilterOption } from "@/hooks/use-media-filter";
import type { MediaFilter } from "@/lib/tmdb";

interface SearchToolbarProps {
  filter: MediaFilter;
  options: LabeledMediaFilterOption[];
  onSelect: (value: MediaFilter) => void;
  invitationCount: number;
  invitationTintColor: ColorValue;
  invitationLabel: string;
  onOpenInvitations: () => void;
}

export function SearchToolbar({
  filter,
  options,
  onSelect,
  invitationCount,
  invitationTintColor,
  invitationLabel,
  onOpenInvitations,
}: SearchToolbarProps) {
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

      {invitationCount > 0 ? (
        <Stack.Toolbar.Button
          icon="bell.badge.fill"
          tintColor={invitationTintColor}
          onPress={onOpenInvitations}>
          {invitationLabel}
        </Stack.Toolbar.Button>
      ) : null}
    </Stack.Toolbar>
  );
}
