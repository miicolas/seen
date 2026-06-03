import { Host, Text as SwiftUIText } from "@expo/ui/swift-ui";
import {
  font,
  foregroundColor,
  lineLimit,
  multilineTextAlignment,
} from "@expo/ui/swift-ui/modifiers";
import {
  StyleSheet,
  Text as RNText,
  type TextStyle,
} from "react-native";

import { FONT_SIZE, LINE_HEIGHT } from "@/constants/design-tokens";
import type { UISize } from "@/types/ui";

type FontWeight =
  | "ultraLight"
  | "thin"
  | "light"
  | "regular"
  | "medium"
  | "semibold"
  | "bold"
  | "heavy"
  | "black";

type TextAlign = "leading" | "center" | "trailing";

export interface TextProps {
  children: string;
  size?: UISize;
  weight?: FontWeight;
  color?: string;
  align?: TextAlign;
  fillWidth?: boolean;
  numberOfLines?: number;
}

const SIZE_TO_FONT: Record<UISize, number> = {
  xs: FONT_SIZE.XS,
  sm: FONT_SIZE.SM,
  md: FONT_SIZE.MD,
  lg: FONT_SIZE.LG,
  xl: FONT_SIZE.XL,
  "2xl": FONT_SIZE.XXL,
};

const SIZE_TO_LINE_HEIGHT: Record<UISize, number> = {
  xs: LINE_HEIGHT.XS,
  sm: LINE_HEIGHT.SM,
  md: LINE_HEIGHT.MD,
  lg: LINE_HEIGHT.LG,
  xl: LINE_HEIGHT.XL,
  "2xl": LINE_HEIGHT.XXL,
};

const WEIGHT_TO_FONT_WEIGHT: Record<FontWeight, TextStyle["fontWeight"]> = {
  ultraLight: "200",
  thin: "100",
  light: "300",
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
  black: "900",
};

const ALIGN_TO_TEXT_ALIGN: Record<TextAlign, TextStyle["textAlign"]> = {
  leading: "left",
  center: "center",
  trailing: "right",
};

export function Text({
  children,
  size = "md",
  weight = "regular",
  color,
  align = "leading",
  fillWidth = false,
  numberOfLines,
}: TextProps) {
  if (fillWidth) {
    return (
      <RNText
        numberOfLines={numberOfLines}
        style={[
          styles.fillWidthText,
          {
            color,
            fontSize: SIZE_TO_FONT[size],
            fontWeight: WEIGHT_TO_FONT_WEIGHT[weight],
            lineHeight: SIZE_TO_LINE_HEIGHT[size],
            textAlign: ALIGN_TO_TEXT_ALIGN[align],
          },
        ]}>
        {children}
      </RNText>
    );
  }

  return (
    <Host matchContents>
      <SwiftUIText
        modifiers={[
          font({ size: SIZE_TO_FONT[size], weight }),
          multilineTextAlignment(align),
          ...(numberOfLines ? [lineLimit(numberOfLines)] : []),
          ...(color ? [foregroundColor(color)] : []),
        ]}>
        {children}
      </SwiftUIText>
    </Host>
  );
}

const styles = StyleSheet.create({
  fillWidthText: {
    width: "100%",
  },
});
