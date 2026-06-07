import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, StyleSheet, useWindowDimensions, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { MaxContentWidth } from "@/constants/theme";
import { useSearchMedia } from "@/hooks/tmdb/use-search-media";
import type { MediaFilter, TmdbMovieSummary } from "@/lib/tmdb";

import { PosterCard } from "./poster-card";

const COLUMNS = 3;
const GUTTER = SPACING.MD;

const keyOf = (media: TmdbMovieSummary, index: number) =>
  `${media.media_type}-${media.id}-${index}`;

export function SearchResults({
  query,
  filter,
  bottomInset,
}: {
  query: string;
  filter: MediaFilter;
  bottomInset: number;
}) {
  const { t } = useTranslation();
  const { results, isLoading, error, isOffline } = useSearchMedia(query, filter);
  const { width } = useWindowDimensions();

  const usable = Math.min(width, MaxContentWidth) - GUTTER * (COLUMNS + 1);
  const cardWidth = usable / COLUMNS;

  if (error) {
    return (
      <View style={styles.center}>
        <Text size="sm" weight="medium" align="center">
          {error}
        </Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.center}>
        {isLoading ? (
          <ActivityIndicator />
        ) : isOffline ? (
          <EmptyState
            icon="wifi.slash"
            title={t("discover.offlineTitle")}
            subtitle={t("discover.offlineSubtitle")}
          />
        ) : (
          <EmptyState
            icon="magnifyingglass"
            title={t("discover.noResults", { query: query.trim() })}
            subtitle={t("discover.noResultsHint")}
          />
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={keyOf}
      numColumns={COLUMNS}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      columnWrapperStyle={styles.row}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      renderItem={({ item }) => <PosterCard movie={item} width={cardWidth} />}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    paddingVertical: SPACING.XXL,
    paddingHorizontal: SPACING.LG,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    gap: GUTTER,
    paddingHorizontal: GUTTER,
  },
  content: {
    gap: GUTTER,
    paddingTop: SPACING.SM,
  },
});
