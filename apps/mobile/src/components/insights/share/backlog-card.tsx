import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { InsightsRing } from "@/lib/native-charts";
import type { ShareRecap } from "@/services/analytics";

import {
  ShareCardFrame,
  shareCardColors,
  type ShareCardFormat,
  shareCardTypography,
} from "./share-card-frame";

export function BacklogCard({
  recap,
  accent,
  format,
}: {
  recap: ShareRecap;
  accent: string;
  format: ShareCardFormat;
}) {
  const backlog = recap.backlog;
  const weeks =
    backlog?.weeks_to_clear != null ? Math.max(1, Math.ceil(backlog.weeks_to_clear)) : null;
  // Gauge: how much of a year clearing the backlog would take, capped.
  const gauge = weeks != null ? Math.min(weeks / 52, 1) : 0;
  const ringSize = format === "story" ? 150 : 104;

  return (
    <ShareCardFrame eyebrow="My backlog" accent={accent} format={format}>
      <View style={styles.row}>
        <View style={{ width: ringSize, height: ringSize }}>
          <InsightsRing
            progress={weeks != null ? gauge : 0.02}
            colors={[accent, `${accent}88`]}
            trackColor={shareCardColors.track}
            lineWidth={12}
            animate={false}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.ringCenter]}>
            <Text style={[shareCardTypography.hero, styles.ringValue]}>{backlog?.count ?? 0}</Text>
            <Text style={shareCardTypography.label}>To watch</Text>
          </View>
        </View>
        <View style={styles.legend}>
          <Text style={shareCardTypography.line}>{backlog?.movie_count ?? 0} movies</Text>
          <Text style={shareCardTypography.line}>{backlog?.tv_count ?? 0} series</Text>
          {weeks != null ? (
            <Text style={[shareCardTypography.line, { color: accent }]}>
              ~{weeks} {weeks === 1 ? "week" : "weeks"} to clear
            </Text>
          ) : null}
        </View>
      </View>
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
  },
  ringCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    fontSize: FONT_SIZE.TITLE,
    letterSpacing: -0.5,
  },
  legend: {
    flex: 1,
    gap: SPACING.XS,
  },
});
