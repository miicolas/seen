import { StyleSheet, Text } from "react-native";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import type { ShareRecap } from "@/services/analytics";

import { ShareCardFrame, shareCardTextColors } from "./share-card-frame";

export function BacklogCard({ recap, accent }: { recap: ShareRecap; accent: string }) {
  const backlog = recap.backlog;
  const weeks = backlog?.weeks_to_clear;

  return (
    <ShareCardFrame eyebrow="My backlog" accent={accent}>
      <Text style={[styles.label, { color: shareCardTextColors.muted }]}>To watch</Text>
      <Text style={[styles.hero, { color: shareCardTextColors.text }]}>{backlog?.count ?? 0}</Text>
      <Text style={[styles.line, { color: shareCardTextColors.muted }]}>
        {backlog?.movie_count ?? 0} movies · {backlog?.tv_count ?? 0} series
      </Text>
      {weeks != null ? (
        <Text style={[styles.line, { color: accent }]}>
          ~{Math.max(1, Math.ceil(weeks))} weeks to clear
        </Text>
      ) : null}
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hero: {
    fontSize: FONT_SIZE.DISPLAY,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  line: {
    fontSize: FONT_SIZE.MD,
    fontWeight: "500",
    marginTop: SPACING.XS,
  },
});
