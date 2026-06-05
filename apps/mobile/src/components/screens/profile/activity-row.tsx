import { Image as ExpoImage } from "expo-image";
import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { PressableScale } from "pressto";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { MetricPill } from "@/components/ui/metric-pill";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import { episodeDetailHref, mediaDetailHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb";
import type { ProfileActivityItem } from "@/services/profiles";

const POSTER_WIDTH = 64;
const POSTER_HEIGHT = 96;

function activityHref(item: ProfileActivityItem) {
  if (item.kind === "episode") {
    return episodeDetailHref(
      {
        seriesId: item.tmdb_id,
        episodeTmdbId: item.episode_tmdb_id ?? 0,
        seasonNumber: item.season_number ?? 0,
        episodeNumber: item.episode_number ?? 0,
        seriesTitle: item.media_title,
        poster_path: item.poster_path,
      },
      "profile",
    );
  }
  return mediaDetailHref(
    {
      id: item.tmdb_id,
      media_type: item.media_type,
      title: item.media_title,
      poster_path: item.poster_path,
      backdrop_path: null,
    },
    "profile",
  );
}

// Native, tappable activity row mirroring the watchlist row: the poster drives
// the Apple zoom transition through a real <Link>, and the runtime pill is
// swapped for the user's rating. Review title and comment show when present.
export function ActivityRow({ item }: { item: ProfileActivityItem }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex, getBackgroundColor } = useAccentColor();
  const posterUri = tmdbImageUrl(item.poster_path, "w342");
  const reviewTitle = item.review_title?.trim();
  const comment = item.comment?.trim();
  const fallback =
    !reviewTitle && !comment && item.rating == null
      ? item.media_subtitle || t("profile.activityFallback")
      : null;

  return (
    <Link href={activityHref(item)} asChild>
      <PressableScale onPress={() => hapticTap()} style={styles.row}>
        <Link.AppleZoom>
          {posterUri ? (
            <ExpoImage
              source={{ uri: posterUri }}
              style={StyleSheet.flatten([
                styles.poster,
                { backgroundColor: theme.backgroundElement },
              ])}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View
              style={StyleSheet.flatten([
                styles.poster,
                styles.posterFallback,
                { backgroundColor: theme.backgroundElement },
              ])}>
              <SymbolView name="film" size={24} tintColor={theme.textSecondary} />
            </View>
          )}
        </Link.AppleZoom>

        <View style={styles.body}>
          <Text size="md" weight="bold" color={theme.text} fillWidth numberOfLines={1}>
            {item.media_title}
          </Text>
          {reviewTitle ? (
            <Text size="sm" weight="medium" color={theme.text} fillWidth numberOfLines={1}>
              {reviewTitle}
            </Text>
          ) : null}
          {comment ? (
            <Text
              size="sm"
              weight="regular"
              color={theme.textSecondary}
              fillWidth
              numberOfLines={2}>
              {comment}
            </Text>
          ) : null}
          {fallback ? (
            <Text
              size="sm"
              weight="regular"
              color={theme.textSecondary}
              fillWidth
              numberOfLines={1}>
              {fallback}
            </Text>
          ) : null}
          {item.rating != null ? (
            <MetricPill
              icon="star.fill"
              iconSize={10}
              label={String(item.rating)}
              tint={accentHex}
              background={getBackgroundColor()}
            />
          ) : null}
        </View>
      </PressableScale>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: POSTER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
  },
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: BORDER_RADIUS.SM,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  posterFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: SPACING.XS,
    justifyContent: "center",
  },
});
