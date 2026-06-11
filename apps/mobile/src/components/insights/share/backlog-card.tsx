import { StyleSheet, Text } from "react-native";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import type { ShareRecap } from "@/services/analytics";

import { ShareCardFrame, shareCardTypography } from "./share-card-frame";

export function BacklogCard({ recap, accent }: { recap: ShareRecap; accent: string }) {
  const backlog = recap.backlog;
  const weeks =
    backlog?.weeks_to_clear != null ? Math.max(1, Math.ceil(backlog.weeks_to_clear)) : null;

  return (
    <ShareCardFrame eyebrow="My backlog" accent={accent}>
      <Text style={shareCardTypography.label}>To watch</Text>
      <Text style={[shareCardTypography.hero, styles.hero]}>{backlog?.count ?? 0}</Text>
      <Text style={shareCardTypography.line}>
        {backlog?.movie_count ?? 0} movies · {backlog?.tv_count ?? 0} series
      </Text>
      {weeks != null ? (
        <Text style={[shareCardTypography.line, { color: accent }]}>
          ~{weeks} {weeks === 1 ? "week" : "weeks"} to clear
        </Text>
      ) : null}
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  hero: {
    fontSize: FONT_SIZE.HEADING_XXL,
    marginVertical: -SPACING.XS,
  },
});
