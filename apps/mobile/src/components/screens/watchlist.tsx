import {
  Button,
  ContentUnavailableView,
  Host,
  List,
  ProgressView,
  RNHostView,
  SwipeActions,
} from "@expo/ui/swift-ui";
import { listRowInsets, listStyle, scrollContentBackground } from "@expo/ui/swift-ui/modifiers";
import { Image as ExpoImage } from "expo-image";
import { Link, Stack, useFocusEffect } from "expo-router";
import { PressableScale } from "pressto";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { MetricPill } from "@/components/ui/metric-pill";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { useWatchlist } from "@/hooks/watchlist/use-watchlist";
import { formatRuntime } from "@/lib/format";
import { hapticDelete, hapticSelection, hapticTap } from "@/lib/haptics";
import { mediaDetailHref } from "@/lib/navigation";
import { tmdbImageUrl, type MediaFilter } from "@/lib/tmdb";
import type { WatchlistItemWithMedia } from "@/services/watchlist";

const POSTER_WIDTH = 64;
const POSTER_HEIGHT = 96;
// Total horizontal inset eaten by the inset List margins + our listRowInsets.
// Slightly generous so the RN content never overflows the cell (a small trailing
// gap is invisible; an overflow would clip the row).
const ROW_HORIZONTAL_INSET = 64;

const FILTER_OPTIONS: {
  value: MediaFilter;
  labelKey: "filterAll" | "filterMovies" | "filterSeries";
  icon: SFSymbol;
}[] = [
  { value: "all", labelKey: "filterAll", icon: "square.grid.2x2" },
  { value: "movie", labelKey: "filterMovies", icon: "film" },
  { value: "tv", labelKey: "filterSeries", icon: "tv" },
];

export function Watchlist() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [filter, setFilter] = useState<MediaFilter>("all");
  const { items, isLoading, error, remove, refetch } = useWatchlist(filter);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const options = useMemo(
    () =>
      FILTER_OPTIONS.map((option) => ({
        ...option,
        label: t(`watchlist.${option.labelKey}`),
      })),
    [t],
  );

  const activeOption = options.find((option) => option.value === filter) ?? options[0];

  function handleFilter(value: MediaFilter) {
    setFilter(value);
    hapticSelection();
  }

  async function handleRemove(item: WatchlistItemWithMedia) {
    hapticDelete();
    await remove(item).catch(() => {});
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon={activeOption.icon}>
          <Stack.Toolbar.Label>{activeOption.label}</Stack.Toolbar.Label>
          {options.map((option) => (
            <Stack.Toolbar.MenuAction
              key={option.value}
              icon={option.icon}
              isOn={filter === option.value}
              onPress={() => handleFilter(option.value)}>
              {option.label}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <Host style={{ flex: 1, backgroundColor: theme.background }}>
        {isLoading ? (
          <ProgressView />
        ) : error ? (
          <ContentUnavailableView
            title={t("watchlist.title")}
            systemImage="exclamationmark.triangle"
            description={error}
          />
        ) : items.length === 0 ? (
          <ContentUnavailableView
            title={t("watchlist.emptyTitle")}
            systemImage="bookmark"
            description={t("watchlist.emptySubtitle")}
          />
        ) : (
          <List modifiers={[listStyle("inset"), scrollContentBackground("hidden")]}>
            {items.map((item) => (
              <WatchlistRow key={item.id} item={item} onRemove={handleRemove} />
            ))}
          </List>
        )}
      </Host>
    </>
  );
}

function WatchlistRow({
  item,
  onRemove,
}: {
  item: WatchlistItemWithMedia;
  onRemove: (item: WatchlistItemWithMedia) => void;
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

  // The row content is hosted in React Native (via RNHostView with matchContents)
  // so the poster can drive the Apple zoom transition through a real <Link>; the
  // SwiftUI List still owns the swipe-to-delete and inset styling. RNHostView has
  // no width of its own, so we pin an explicit row width for the text to wrap.
  return (
    <SwipeActions modifiers={[listRowInsets({ top: 8, bottom: 8, leading: 16, trailing: 16 })]}>
      <RNHostView matchContents>
        <Link href={mediaDetailHref(item.media, "watchlist")} asChild>
          <PressableScale
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
          </PressableScale>
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
