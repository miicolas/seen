import { View, StyleSheet } from "react-native";

import { StarRating } from "@/components/ui/star-rating";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

import { metaLine } from "./utils";

export function MediaSummary({
  title,
  tagline,
  year,
  runtime,
  genres,
  myStars,
  hasReview,
}: {
  title: string;
  tagline?: string;
  year?: string;
  runtime?: string;
  genres?: string;
  myStars: number;
  hasReview: boolean;
}) {
  const theme = useTheme();
  const meta = metaLine([year, runtime, genres]);

  return (
    <>
      <Text size="2xl" weight="bold" align="center" color={theme.text} fillWidth>
        {title}
      </Text>
      {tagline ? (
        <Text
          size="sm"
          weight="regular"
          align="center"
          color={theme.textSecondary}
          fillWidth>
          {tagline}
        </Text>
      ) : null}
      {meta ? (
        <Text
          size="sm"
          weight="regular"
          align="center"
          color={theme.textSecondary}
          fillWidth>
          {meta}
        </Text>
      ) : null}
      {hasReview && myStars > 0 ? (
        <View style={styles.myRating}>
          <StarRating value={myStars} size="sm" readOnly />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  myRating: {
    alignItems: "center",
    paddingTop: SPACING.XXS,
  },
});
