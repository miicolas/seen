import { Button, RNHostView, SwipeActions } from "@expo/ui/swift-ui";
import { listRowInsets, onAppear as onAppearModifier } from "@expo/ui/swift-ui/modifiers";
import { Image as ExpoImage } from "expo-image";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { MetricPill } from "@/components/ui/metric-pill";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { formatRuntime } from "@/lib/format";
import { hapticTap } from "@/lib/haptics";
import { mediaDetailHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb";
import type { WatchlistItemWithMedia } from "@/services/watchlist";

const POSTER_WIDTH = 64;
const POSTER_HEIGHT = 96;
// Total horizontal inset eaten by the inset List margins + our listRowInsets.
// Slightly generous so the RN content never overflows the cell (a small trailing
// gap is invisible; an overflow would clip the row).
const ROW_HORIZONTAL_INSET = 64;

export function WatchlistRow({
  item,
  onRemove,
  onReveal,
}: {
  item: WatchlistItemWithMedia;
  onRemove: (item: WatchlistItemWithMedia) => void;
  // Fires when this row scrolls into view — used on the last row to page in more.
  onReveal?: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex, getBackgroundColor } = useAccentColor();
  const { width } = useWindowDimensions();
  const posterUri = tmdbImageUrl(item.media.poster_path ?? item.media.backdrop_path, "w342");
  const title = item.media.title ?? item.media.original_title ?? t("mediaDetail.untitled");
  const overview = item.media.overview?.trim();
  const duration = formatRuntime(item.media.runtime);
  const rowWidth = width - ROW_HORIZONTAL_INSET;

  const rowModifiers = [listRowInsets({ top: 8, bottom: 8, leading: 16, trailing: 16 })];
  if (onReveal) rowModifiers.push(onAppearModifier(onReveal));

  // The row content is hosted in React Native (via RNHostView with matchContents)
  // so the poster can drive the Apple zoom transition through a real <Link>; the
  // SwiftUI List still owns the swipe-to-delete and inset styling. RNHostView has
  // no width of its own, so we pin an explicit row width for the text to wrap.
  return (
    <SwipeActions modifiers={rowModifiers}>
      <RNHostView matchContents>
        <Link href={mediaDetailHref(item.media, "watchlist")} asChild>
          <Pressable
            onPress={() => hapticTap()}
            style={StyleSheet.flatten([styles.row, { width: rowWidth }])}>
            <Link.AppleZoom>
              <ExpoImage
                source={posterUri ? { uri: posterUri } : undefined}
                style={StyleSheet.flatten([
                  styles.poster,
                  { backgroundColor: theme.backgroundElement },
                ])}
                contentFit="cover"
                transition={200}
              />
            </Link.AppleZoom>
            <View style={styles.body}>
              <Text size="md" weight="bold" color={theme.text} fillWidth numberOfLines={1}>
                {title}
              </Text>
              {overview ? (
                <Text
                  size="sm"
                  weight="regular"
                  color={theme.textSecondary}
                  fillWidth
                  numberOfLines={2}>
                  {overview}
                </Text>
              ) : null}
              {duration ? (
                <MetricPill
                  icon="play.fill"
                  iconSize={10}
                  label={duration}
                  tint={accentHex}
                  background={getBackgroundColor()}
                />
              ) : null}
            </View>
          </Pressable>
        </Link>
      </RNHostView>
      <SwipeActions.Actions edge="trailing" allowsFullSwipe>
        <Button
          role="destructive"
          systemImage="trash"
          label={t("watchlist.remove")}
          onPress={() => onRemove(item)}
        />
      </SwipeActions.Actions>
    </SwipeActions>
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
  },
  body: {
    flex: 1,
    gap: SPACING.XS,
    justifyContent: "center",
  },
});
