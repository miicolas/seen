import {
  Host,
  HStack,
  Text as SwiftUIText,
  TextField,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  frame,
  padding,
  textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";
import { useWindowDimensions } from "react-native";

import { FONT_SIZE, LAYOUT } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

const ROW_VERTICAL_PADDING = 14;
const MULTILINE_MIN_HEIGHT = 88;

interface FieldRowProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
}

// Native label + TextField row. The field is seeded once from `value` (the row
// mounts only after its data has loaded, so the seed is the right initial value)
// and reports edits through `onChangeText` — a controlled re-push would go stale
// against the native text state.
export function FieldRow({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: FieldRowProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const text = useNativeState(value);

  const contentWidth = Math.min(
    LAYOUT.CONTENT_MAX_WIDTH,
    Math.max(0, width - LAYOUT.SCREEN_PADDING * 2),
  );
  const innerWidth = Math.max(0, contentWidth - LAYOUT.FIELD_ROW_PADDING * 2);

  return (
    <Host matchContents>
      <HStack
        alignment={multiline ? "top" : "center"}
        spacing={0}
        modifiers={[
          frame({ width: innerWidth, alignment: "leading" }),
          padding({
            horizontal: LAYOUT.FIELD_ROW_PADDING,
            vertical: ROW_VERTICAL_PADDING,
          }),
        ]}
      >
        <SwiftUIText
          modifiers={[
            font({ size: FONT_SIZE.MD, weight: "semibold" }),
            foregroundStyle(theme.text),
            frame({ width: LAYOUT.FIELD_LABEL_WIDTH, alignment: "leading" }),
          ]}
        >
          {label}
        </SwiftUIText>
        <TextField
          placeholder={placeholder}
          text={text}
          onTextChange={onChangeText}
          axis={multiline ? "vertical" : "horizontal"}
          modifiers={[
            font({ size: FONT_SIZE.MD }),
            foregroundStyle(theme.text),
            textInputAutocapitalization("sentences"),
            frame({
              maxWidth: Infinity,
              alignment: "leading",
              ...(multiline ? { minHeight: MULTILINE_MIN_HEIGHT } : {}),
            }),
          ]}
        />
      </HStack>
    </Host>
  );
}
