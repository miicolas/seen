import { PressableScale } from "pressto";
import type { ReactNode } from "react";
import { StyleSheet, useColorScheme, View, type ViewStyle } from "react-native";

import { Colors } from "@/constants/theme";
import { BORDER_RADIUS, BORDER_WIDTH, SPACING } from "@/constants/design-tokens";

type CardVariant = "bordered" | "plain";

interface CardProps {
  children?: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = "plain",
  onPress,
  onLongPress,
  style,
}: CardProps) {
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  const cardStyle: ViewStyle = {
    backgroundColor: theme.backgroundElement,
    borderWidth: variant === "bordered" ? BORDER_WIDTH.THIN : BORDER_WIDTH.NONE,
    borderColor: theme.backgroundSelected,
  };

  if (onPress || onLongPress) {
    return (
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        style={StyleSheet.flatten([styles.card, cardStyle, style])}>
        {children}
      </PressableScale>
    );
  }

  return <View style={[styles.card, cardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    borderCurve: "continuous",
    overflow: "hidden",
  },
});
