import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { StreakDots } from "@/components/insights/charts/streak-dots";
import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { formatWatchMinutes } from "@/lib/format";
import type { ShareRecap } from "@/services/analytics";

import { CardSparkline } from "./card-sparkline";
import {
  ShareCardFrame,
  shareCardColors,
  type ShareCardFormat,
  shareCardTypography,
} from "./share-card-frame";

export function StatsCard({
  recap,
  accent,
  format,
}: {
  recap: ShareRecap;
  accent: string;
  format: ShareCardFormat;
}) {
  const points = useMemo(
    () => (recap.sparkline_minutes ?? []).map((value, index) => ({ label: String(index), value })),
    [recap.sparkline_minutes],
  );
  const activeDays = points.map((point) => point.value > 0);

  return (
    <ShareCardFrame eyebrow="Last 30 days" accent={accent} format={format}>
      <Text style={shareCardTypography.label}>Streak</Text>
      <Text style={shareCardTypography.hero}>
        {recap.streak?.current_streak_days ?? 0}
        <Text style={styles.heroUnit}> days</Text>
      </Text>
      <Text style={shareCardTypography.line}>
        Longest {recap.streak?.longest_streak_days ?? 0} days ·{" "}
        {formatWatchMinutes(recap.total_minutes ?? 0)} watched
      </Text>
      <CardSparkline
        points={points}
        accent={accent}
        format={format}
        storyHeight={130}
        squareHeight={64}
        xAxisHidden
      />
      <View style={styles.dots}>
        <StreakDots days={activeDays} color={accent} inactiveColor={shareCardColors.track} />
      </View>
      <Text style={shareCardTypography.line}>
        {recap.media_count ?? 0} titles · {recap.episode_count ?? 0} episodes
      </Text>
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  heroUnit: {
    fontSize: FONT_SIZE.XXL,
    fontWeight: "700",
    color: shareCardColors.muted,
    letterSpacing: 0,
  },
  dots: {
    marginTop: SPACING.XS,
  },
});
