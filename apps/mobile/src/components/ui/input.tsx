import { Host, SecureField, TextField } from "@expo/ui/swift-ui";
import {
  autocorrectionDisabled,
  background,
  border,
  clipShape,
  foregroundColor,
  frame,
  keyboardType as keyboardTypeModifier,
  onSubmit as onSubmitModifier,
  padding,
  submitLabel as submitLabelModifier,
  textContentType as textContentTypeModifier,
  textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";

import { COMPONENT_HEIGHT, SPACING } from "@/constants/design-tokens";
import { useVariantConfig } from "@/hooks/use-variant-config";
import {
  RADIUS_VALUES,
  type InputColorConfig,
  type UIColor,
  type UIRadius,
  type UISize,
} from "@/types/ui";

type InputVariant = "outline" | "soft" | "subtle" | "underline";

type KeyboardType = Parameters<typeof keyboardTypeModifier>[0];
type ContentType = Parameters<typeof textContentTypeModifier>[0];
type Capitalization = Parameters<typeof textInputAutocapitalization>[0];
type SubmitLabel = Parameters<typeof submitLabelModifier>[0];

/** Observable text state from `useNativeState('')`, as accepted by SwiftUI TextField. */
export type ObservableText = Parameters<typeof TextField>[0]["text"];

/** A multiline field is this many times taller than its single-line height. */
const MULTILINE_HEIGHT_MULTIPLIER = 2.6;

export interface InputProps {
  placeholder?: string;
  onChangeText?: (text: string) => void;
  /** Observable text state (`useNativeState('')`) — enables prefilling/reading the value. */
  state?: ObservableText;
  secure?: boolean;
  variant?: InputVariant;
  color?: UIColor;
  size?: UISize;
  radius?: UIRadius;
  width?: number;
  multiline?: boolean;
  keyboardType?: KeyboardType;
  textContentType?: ContentType;
  autocapitalization?: Capitalization;
  autocorrection?: boolean;
  submitLabel?: SubmitLabel;
  onSubmit?: () => void;
}

const SIZE_TO_HEIGHT: Record<UISize, number> = {
  xs: COMPONENT_HEIGHT.XS,
  sm: COMPONENT_HEIGHT.SM,
  md: COMPONENT_HEIGHT.MD,
  lg: COMPONENT_HEIGHT.LG,
  xl: COMPONENT_HEIGHT.XL,
  "2xl": COMPONENT_HEIGHT.XXL,
  "3xl": COMPONENT_HEIGHT.XXXL,
  "4xl": COMPONENT_HEIGHT.XXXXL,
  "5xl": COMPONENT_HEIGHT.XXXXXL,
};

export function Input({
  placeholder,
  onChangeText,
  state,
  secure = false,
  variant = "soft",
  color = "neutral",
  size = "lg",
  radius = "md",
  width,
  multiline = false,
  keyboardType,
  textContentType,
  autocapitalization,
  autocorrection,
  submitLabel,
  onSubmit,
}: InputProps) {
  const variants = useVariantConfig(color, {
    supportedVariants: ["outline", "soft", "subtle", "underline"],
    includePlaceholderColor: true,
  });
  const cfg = variants[variant] as InputColorConfig;

  const height = SIZE_TO_HEIGHT[size];
  const radiusPx = RADIUS_VALUES[radius];

  const modifiers = [
    foregroundColor(cfg.textColor),
    padding({ horizontal: SPACING.MD }),
    ...(cfg.backgroundColor !== "transparent"
      ? [background(cfg.backgroundColor)]
      : []),
    ...(cfg.borderWidth > 0
      ? [border({ color: cfg.borderColor, width: cfg.borderWidth })]
      : []),
    clipShape("roundedRectangle", radiusPx),
    frame({
      height: multiline
        ? Math.round(height * MULTILINE_HEIGHT_MULTIPLIER)
        : height,
      ...(width ? { width } : {}),
    }),
    ...(keyboardType ? [keyboardTypeModifier(keyboardType)] : []),
    ...(textContentType ? [textContentTypeModifier(textContentType)] : []),
    ...(autocapitalization
      ? [textInputAutocapitalization(autocapitalization)]
      : []),
    ...(autocorrection === false ? [autocorrectionDisabled(true)] : []),
    ...(submitLabel ? [submitLabelModifier(submitLabel)] : []),
    ...(onSubmit ? [onSubmitModifier(onSubmit)] : []),
  ];

  if (secure) {
    return (
      <Host matchContents>
        <SecureField
          placeholder={placeholder}
          onTextChange={onChangeText}
          modifiers={modifiers}
        />
      </Host>
    );
  }

  return (
    <Host matchContents>
      <TextField
        placeholder={placeholder}
        onTextChange={onChangeText}
        modifiers={modifiers}
        axis={multiline ? "vertical" : "horizontal"}
        {...(state ? { text: state } : {})}
      />
    </Host>
  );
}
