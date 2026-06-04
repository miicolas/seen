import {
  Host,
  Picker,
  Text as SwiftUIText,
} from "@expo/ui/swift-ui";
import { pickerStyle, tag, tint } from "@expo/ui/swift-ui/modifiers";

import { getColorValue } from "@/constants/colors";
import { useAccentColor } from "@/hooks/use-accent-color";
import type { UIColor } from "@/types/ui";
import { useColorScheme } from "react-native";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string | number> {
  options: SegmentedOption<T>[];
  selection: T;
  onChange: (value: T) => void;
  color?: UIColor;
}

export function Segmented<T extends string | number>({
  options,
  selection,
  onChange,
  color,
}: SegmentedProps<T>) {
  const isDark = useColorScheme() === "dark";
  const { accentHex } = useAccentColor();
  const tintColor = color ? getColorValue(color, isDark ? 400 : 500) : accentHex;

  return (
    <Host matchContents>
      <Picker
        selection={selection}
        onSelectionChange={onChange}
        modifiers={[pickerStyle("segmented"), tint(tintColor)]}>
        {options.map((option) => (
          <SwiftUIText key={String(option.value)} modifiers={[tag(option.value)]}>
            {option.label}
          </SwiftUIText>
        ))}
      </Picker>
    </Host>
  );
}
