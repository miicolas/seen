import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { StreakDots } from "@/components/insights/charts/streak-dots";
import { InsightCard } from "@/components/insights/insight-card";
import { StatTile } from "@/components/insights/stat-tile";
import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import type { Streaks } from "@/services/analytics";

export function StreakSection({ streaks }: { streaks: Streaks }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex } = useAccentColor();

  if (streaks.longest_streak_days === 0) return null;

  return (
    <InsightCard title={t("insights.streakTitle")}>
      <View style={styles.stats}>
        <StatTile
          value={t("insights.streakDays", { count: streaks.current_streak_days })}
          label={t("insights.streakCurrent")}
          tint={streaks.current_streak_days > 0 ? accentHex : undefined}
        />
        <StatTile
          value={t("insights.streakDays", { count: streaks.longest_streak_days })}
          label={t("insights.streakLongest")}
        />
      </View>
      <StreakDots
        days={streaks.last_30_days}
        color={accentHex}
        inactiveColor={theme.backgroundSelected}
      />
      <Text style={[styles.caption, { color: theme.textSecondary }]}>
        {t("insights.streakLast30")}
      </Text>
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    gap: SPACING.SM,
  },
  caption: {
    fontSize: FONT_SIZE.XS,
  },
});
