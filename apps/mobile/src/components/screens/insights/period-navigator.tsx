import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BORDER_RADIUS, FONT_SIZE, OPACITY, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import type { AnalyticsRange, Period } from "@/services/analytics";

interface PeriodNavigatorProps {
  range: AnalyticsRange;
  period: Period | undefined;
  onPrevious: () => void;
  onNext: () => void;
}

function formatPeriodLabel(period: Period, locale: string): string {
  const from = new Date(period.from);
  if (period.range === "year") {
    return new Intl.DateTimeFormat(locale, { year: "numeric" }).format(from);
  }
  if (period.range === "month") {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(from);
  }
  // Week: label the span using its last day (period.to is exclusive).
  const lastDay = new Date(new Date(period.to).getTime() - 1);
  const day = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  return `${day.format(from)} – ${day.format(lastDay)}`;
}

export function PeriodNavigator({ range, period, onPrevious, onNext }: PeriodNavigatorProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  if (range === "all" || !period) return null;

  const canGoPrevious = period.has_previous;
  const canGoNext = !period.is_current;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPrevious}
        disabled={!canGoPrevious}
        accessibilityRole="button"
        accessibilityLabel={t("insights.previousPeriod")}
        style={[
          styles.chevron,
          { backgroundColor: theme.backgroundElement },
          !canGoPrevious && styles.disabled,
        ]}>
        <SymbolView name="chevron.left" size={14} type="monochrome" tintColor={theme.text} />
      </Pressable>
      <Text style={[styles.label, { color: theme.text }]}>
        {formatPeriodLabel(period, i18n.language)}
      </Text>
      <Pressable
        onPress={onNext}
        disabled={!canGoNext}
        accessibilityRole="button"
        accessibilityLabel={t("insights.nextPeriod")}
        style={[
          styles.chevron,
          { backgroundColor: theme.backgroundElement },
          !canGoNext && styles.disabled,
        ]}>
        <SymbolView name="chevron.right" size={14} type="monochrome" tintColor={theme.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.SM,
  },
  chevron: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.FULL,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: OPACITY.DISABLED,
  },
  label: {
    fontSize: FONT_SIZE.MD,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
