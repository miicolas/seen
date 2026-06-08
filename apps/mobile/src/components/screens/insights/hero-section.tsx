import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { InsightCard } from "@/components/insights/insight-card";
import { StatTile } from "@/components/insights/stat-tile";
import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { formatWatchMinutes } from "@/lib/format";
import type { Overview } from "@/services/analytics";

export function HeroSection({ overview }: { overview: Overview }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex } = useAccentColor();

  const pct = overview.deltas.minutes_pct;
  const deltaText =
    pct != null
      ? `${pct >= 0 ? "+" : ""}${Math.round(pct * 100)}% ${t("insights.vsPrevious")}`
      : null;
  const unknown = overview.watched_time.unknown_count;

  return (
    <InsightCard>
      <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
        {t("insights.watchedTime")}
      </Text>
      <Text style={[styles.hero, { color: theme.text }]}>
        {formatWatchMinutes(overview.total_minutes)}
      </Text>
      {deltaText ? (
        <Text style={[styles.delta, { color: pct! >= 0 ? accentHex : theme.textSecondary }]}>
          {deltaText}
        </Text>
      ) : null}

      <View style={styles.stats}>
        <StatTile value={String(overview.media_count)} label={t("insights.titlesLogged")} />
        <StatTile value={String(overview.episode_count)} label={t("insights.episodes")} />
        <StatTile
          value={overview.average_rating != null ? `${overview.average_rating}★` : "—"}
          label={t("insights.avgRating")}
        />
      </View>

      {unknown > 0 ? (
        <Text style={[styles.note, { color: theme.textSecondary }]}>
          {t("insights.untimed", { count: unknown })}
        </Text>
      ) : null}
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hero: {
    fontSize: FONT_SIZE.HEADING_LG,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  delta: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
  },
  stats: {
    flexDirection: "row",
    gap: SPACING.SM,
    marginTop: SPACING.SM,
  },
  note: {
    fontSize: FONT_SIZE.XS,
    marginTop: 2,
  },
});
