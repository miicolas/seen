import { Image as ExpoImage } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { mediaDetailHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb";
import type { TimelineItem } from "@/services/analytics";

export function TimelineItemRow({ item }: { item: TimelineItem }) {
  const theme = useTheme();
  const poster = tmdbImageUrl(item.poster_path, "w154");
  const subtitle =
    item.kind === "episode" && item.season_number != null && item.episode_number != null
      ? `S${item.season_number} E${item.episode_number}`
      : undefined;

  return (
    <Link
      href={mediaDetailHref(
        {
          id: item.tmdb_id,
          media_type: item.media_type,
          title: item.title,
          poster_path: item.poster_path,
        },
        "insights",
      )}
      asChild>
      <Pressable style={styles.row}>
        <ExpoImage
          source={poster ? { uri: poster } : undefined}
          style={[styles.poster, { backgroundColor: theme.backgroundSelected }]}
          contentFit="cover"
        />
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {subtitle ? (
            <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        {item.rating != null ? (
          <Text style={[styles.rowRating, { color: theme.textSecondary }]}>{item.rating}★</Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
  },
  poster: {
    width: 36,
    height: 54,
    borderRadius: BORDER_RADIUS.SM,
    borderCurve: "continuous",
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
  },
  rowSubtitle: {
    fontSize: FONT_SIZE.XS,
  },
  rowRating: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
