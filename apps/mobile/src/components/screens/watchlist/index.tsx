import { ContentUnavailableView, Host, List, ProgressView } from "@expo/ui/swift-ui";
import { listStyle, scrollContentBackground } from "@expo/ui/swift-ui/modifiers";
import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeSyntheticEvent, TextInputFocusEventData } from "react-native";

import { MediaFilterToolbar } from "@/components/ui/media-filter-toolbar";
import { useMediaFilter } from "@/hooks/use-media-filter";
import { useTheme } from "@/hooks/use-theme";
import { useWatchlist } from "@/hooks/watchlist/use-watchlist";
import { hapticDelete } from "@/lib/haptics";
import type { WatchlistItemWithMedia } from "@/services/watchlist";

import { WatchlistRow } from "./watchlist-row";

export function Watchlist() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { filter, options, selectFilter } = useMediaFilter("watchlist");
  const [query, setQuery] = useState("");
  const { items, isLoading, error, remove, refetch, loadMore } = useWatchlist(filter, query);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const isSearching = query.trim().length > 0;

  function handleSearchText(e: NativeSyntheticEvent<TextInputFocusEventData>) {
    setQuery(e.nativeEvent.text ?? "");
  }

  async function handleRemove(item: WatchlistItemWithMedia) {
    hapticDelete();
    await remove(item).catch(() => {});
  }

  return (
    <>
      <MediaFilterToolbar filter={filter} options={options} onSelect={selectFilter} />

      <Stack.SearchBar
        placeholder={t("watchlist.searchPlaceholder")}
        onChangeText={handleSearchText}
        onCancelButtonPress={() => setQuery("")}
        onClose={() => setQuery("")}
      />

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
          isSearching ? (
            <ContentUnavailableView
              title={t("watchlist.noResults", { query: query.trim() })}
              systemImage="magnifyingglass"
              description={t("watchlist.noResultsHint")}
            />
          ) : (
            <ContentUnavailableView
              title={t("watchlist.emptyTitle")}
              systemImage="bookmark"
              description={t("watchlist.emptySubtitle")}
            />
          )
        ) : (
          <List modifiers={[listStyle("inset"), scrollContentBackground("hidden")]}>
            {items.map((item, index) => (
              <WatchlistRow
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onReveal={index === items.length - 1 ? loadMore : undefined}
              />
            ))}
          </List>
        )}
      </Host>
    </>
  );
}
