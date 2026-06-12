import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { RingStat } from "@/components/insights/charts/ring-stat";
import { InsightCard } from "@/components/insights/insight-card";
import { SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useTheme } from "@/hooks/use-theme";
import { formatWatchMinutes } from "@/lib/format";
import type { Series } from "@/services/analytics";

function ringProgress(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 1 : 0;
  return Math.min(current / previous, 1);
}

export function RingsRow({ series }: { series: Series }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { getPrimaryColor } = useAccentColor();
  const reducedMotion = useReducedMotion();

  const { watch_time, titles, episodes } = series.summary;
  if (watch_time.current === 0 && titles.current === 0 && episodes.current === 0) return null;

  const rings = [
    {
      key: "watch_time",
      progress: ringProgress(watch_time.current, watch_time.previous),
      value: formatWatchMinutes(watch_time.current),
      label: t("insights.watchedTime"),
      sublabel: t("insights.prevShort", { value: formatWatchMinutes(watch_time.previous) }),
      colors: [getPrimaryColor(500), getPrimaryColor(300)],
    },
    {
      key: "titles",
      progress: ringProgress(titles.current, titles.previous),
      value: String(titles.current),
      label: t("insights.titlesLogged"),
      sublabel: t("insights.prevShort", { value: String(titles.previous) }),
      colors: [getPrimaryColor(400), getPrimaryColor(200)],
    },
    {
      key: "episodes",
      progress: ringProgress(episodes.current, episodes.previous),
      value: String(episodes.current),
      label: t("insights.episodes"),
      sublabel: t("insights.prevShort", { value: String(episodes.previous) }),
      colors: [getPrimaryColor(600), getPrimaryColor(400)],
    },
  ];

  return (
    <InsightCard title={t("insights.ringsTitle")}>
      <View style={styles.row}>
        {rings.map((ring) => (
          <RingStat
            // Native ring props don't survive in-place updates; remount per dataset.
            key={`${ring.key}:${series.period.from}:${ring.value}`}
            progress={ring.progress}
            value={ring.value}
            label={ring.label}
            sublabel={ring.sublabel}
            colors={ring.colors}
            trackColor={theme.backgroundSelected}
            animate={!reducedMotion}
          />
        ))}
      </View>
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACING.SM,
  },
});
