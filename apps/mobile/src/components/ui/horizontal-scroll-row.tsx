import type { ReactNode } from "react";
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { SPACING } from "@/constants/design-tokens";

interface HorizontalScrollRowProps {
  children: ReactNode;
  gap?: number;
  // Lets the row bleed to the screen edges while keeping its first/last item
  // aligned with the surrounding SPACING.MD padding.
  edgeToEdge?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function HorizontalScrollRow({
  children,
  gap = SPACING.SM,
  edgeToEdge = false,
  contentStyle,
}: HorizontalScrollRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={edgeToEdge ? styles.edgeToEdge : undefined}
      contentContainerStyle={[
        styles.content,
        { gap },
        edgeToEdge ? styles.edgeToEdgeContent : null,
        contentStyle,
      ]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: SPACING.XS,
  },
  edgeToEdge: {
    marginHorizontal: -SPACING.MD,
  },
  edgeToEdgeContent: {
    paddingHorizontal: SPACING.MD,
  },
});
