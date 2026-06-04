import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { StarRating } from "@/components/ui/star-rating";
import { Text } from "@/components/ui/text";
import {
  BORDER_RADIUS,
  BORDER_WIDTH,
  SPACING,
} from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { formatDate } from "@/lib/format";
import { tmdbImageUrl } from "@/lib/tmdb";
import { ratingToStars } from "@/services/core";
import type { ProfileActivityItem } from "@/services/profiles";

export function ActivityRow({ item }: { item: ProfileActivityItem }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const posterUri = tmdbImageUrl(item.poster_path, "w154");
  const title =
    item.review_title?.trim() ||
    item.comment?.trim() ||
    (item.rating ? t("profile.ratingAdded") : t("profile.activityFallback"));

  return (
    <View
      style={[styles.activityRow, { borderTopColor: theme.backgroundSelected }]}>
      {posterUri ? (
        <Image
          source={{ uri: posterUri }}
          contentFit="cover"
          style={styles.poster}
        />
      ) : (
        <View
          style={[
            styles.poster,
            styles.posterFallback,
            { backgroundColor: theme.backgroundElement },
          ]}>
          <SymbolView name="film" size={24} tintColor={theme.textSecondary} />
        </View>
      )}

      <View style={styles.activityCopy}>
        <View style={styles.activityTopLine}>
          <Text
            size="sm"
            weight="bold"
            color={theme.text}
            fillWidth
            numberOfLines={1}>
            {item.media_title}
          </Text>
          <Text size="xs" weight="regular" color={theme.textSecondary}>
            {formatDate(item.created_at) ?? item.created_at}
          </Text>
        </View>

        <Text size="xs" weight="regular" color={theme.textSecondary} fillWidth>
          {item.media_subtitle}
        </Text>

        <View style={styles.ratingLine}>
          {item.rating != null ? (
            <StarRating
              value={ratingToStars(item.rating)}
              size="xs"
              emptyColor={theme.backgroundSelected}
              readOnly
            />
          ) : null}
          <Text
            size="xs"
            weight="medium"
            color={theme.text}
            fillWidth
            numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activityRow: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
    paddingVertical: 12,
    borderTopWidth: BORDER_WIDTH.THIN,
  },
  poster: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.SM,
    overflow: "hidden",
  },
  posterFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  activityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  activityTopLine: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
  },
  ratingLine: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
  },
});
