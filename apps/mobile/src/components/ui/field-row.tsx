import { Host, HStack, Text as SwiftUIText, TextField } from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";
import { useWindowDimensions } from "react-native";

import { type ObservableText } from "./input";
import { FONT_SIZE, LAYOUT } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

const ROW_VERTICAL_PADDING = 14;
const MULTILINE_MIN_HEIGHT = 88;

interface FieldRowProps {
  label: string;
  // Externally-owned native text state (`useNativeState`). The owner seeds it and
  // reads `.value` lazily; binding it keeps typing on the native side without a
  // per-keystroke React re-render.
  state: ObservableText;
  // Optional change signal — forward only when the owner derives reactive state
  // (e.g. an enable/disable flag or a validity hint) from the text.
  onChangeText?: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
}

// Native label + TextField row, driven by an external observable text state.
export function FieldRow({
  label,
  state,
  onChangeText,
  placeholder,
  multiline = false,
}: FieldRowProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

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
        ]}>
        <SwiftUIText
          modifiers={[
            font({ size: FONT_SIZE.MD, weight: "semibold" }),
            foregroundStyle(theme.text),
            lineLimit(1),
            frame({ width: LAYOUT.FIELD_LABEL_WIDTH, alignment: "leading" }),
          ]}>
          {label}
        </SwiftUIText>
        <TextField
          placeholder={placeholder}
          text={state}
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
