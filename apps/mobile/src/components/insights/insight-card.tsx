import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

interface InsightCardProps {
  title?: string;
  subtitle?: string;
  trailing?: ReactNode;
  children: ReactNode;
}

// The shared shell for every Insights section: a rounded, themed panel with an
// optional header row. Keeps spacing and the card surface consistent so the screen
// reads as one dashboard, not a pile of mismatched widgets.
export function InsightCard({ title, subtitle, trailing, children }: InsightCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      {title ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
            ) : null}
          </View>
          {trailing ? <View>{trailing}</View> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.MD,
    borderCurve: "continuous",
    padding: SPACING.MD,
    gap: SPACING.SM,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.SM,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FONT_SIZE.LG,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "400",
  },
});
