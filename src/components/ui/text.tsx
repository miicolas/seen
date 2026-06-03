import { Host, Text as SwiftUIText } from "@expo/ui/swift-ui";
import {
  font,
  foregroundColor,
  multilineTextAlignment,
} from "@expo/ui/swift-ui/modifiers";

import { FONT_SIZE } from "@/constants/design-tokens";
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
}

const SIZE_TO_FONT: Record<UISize, number> = {
  xs: FONT_SIZE.XS,
  sm: FONT_SIZE.SM,
  md: FONT_SIZE.MD,
  lg: FONT_SIZE.LG,
  xl: FONT_SIZE.XL,
  "2xl": FONT_SIZE.XXL,
};

export function Text({
  children,
  size = "md",
  weight = "regular",
  color,
  align = "leading",
}: TextProps) {
  return (
    <Host matchContents>
      <SwiftUIText
        modifiers={[
          font({ size: SIZE_TO_FONT[size], weight }),
          multilineTextAlignment(align),
          ...(color ? [foregroundColor(color)] : []),
        ]}>
        {children}
      </SwiftUIText>
    </Host>
  );
}
