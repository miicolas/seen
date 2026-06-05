import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BORDER_RADIUS, OPACITY, SPACING } from "@/constants/design-tokens";

interface SectionProps {
  title?: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <View style={styles.container}>
      {title ? (
        <ThemedText type="smallBold" style={styles.title}>
          {title}
        </ThemedText>
      ) : null}
      <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.card}>
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: SPACING.SM,
  },
  title: {
    opacity: OPACITY.MUTED + 0.2,
    paddingHorizontal: SPACING.XS,
  },
  card: {
    width: "100%",
    padding: SPACING.MD,
    gap: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
    borderCurve: "continuous",
    overflow: "hidden",
  },
});
