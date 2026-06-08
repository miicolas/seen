import { Section } from "@expo/ui/swift-ui";
import type { ReactElement } from "react";

import { hapticSelection } from "@/lib/haptics";

import { SettingsRow } from "../settings-row";

export type SelectableItem<T extends string | number> = {
  value: T;
  label: string;
};

type Props<T extends string | number> = {
  title: string;
  items: SelectableItem<T>[];
  selected: Set<T>;
  onToggle: (value: T) => void;
  footer?: ReactElement;
};

// A Form section of toggleable rows backed by a Set — the shared shape behind
// the favorite-genres, disliked-genres, and moods pickers.
export function SelectableSection<T extends string | number>({
  title,
  items,
  selected,
  onToggle,
  footer,
}: Props<T>) {
  function select(value: T) {
    hapticSelection();
    onToggle(value);
  }

  return (
    <Section title={title} footer={footer}>
      {items.map((item) => (
        <SettingsRow
          key={String(item.value)}
          icon={selected.has(item.value) ? "checkmark.circle.fill" : "circle"}
          label={item.label}
          onPress={() => select(item.value)}
        />
      ))}
    </Section>
  );
}
