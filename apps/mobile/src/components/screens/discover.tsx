import { Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeSyntheticEvent, TextInputFocusEventData } from "react-native";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DiscoverContainer } from "@/components/discover/container";
import { SearchResults } from "@/components/discover/search-results";
import { MediaFilterToolbar } from "@/components/ui/media-filter-toolbar";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useMediaFilter } from "@/hooks/use-media-filter";

export function Discover() {
  const { t } = useTranslation();
  const safeAreaInsets = useSafeAreaInsets();

  const { filter, options, selectFilter } = useMediaFilter("discover");
  const [query, setQuery] = useState("");

  const isSearching = query.trim().length > 0;
  const bottomInset = safeAreaInsets.bottom + BottomTabInset + Spacing.three;

  function handleSearchText(e: NativeSyntheticEvent<TextInputFocusEventData>) {
    setQuery(e.nativeEvent.text);
  }

  return (
    <>
      <MediaFilterToolbar filter={filter} options={options} onSelect={selectFilter} />

      <Stack.SearchBar
        placeholder={t("discover.searchPlaceholder")}
        onChangeText={handleSearchText}
        onCancelButtonPress={() => setQuery("")}
        onClose={() => setQuery("")}
      />

      {isSearching ? (
        <SearchResults query={query} filter={filter} bottomInset={bottomInset} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: bottomInset }}>
          <DiscoverContainer filter={filter} />
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: "100%",
  },
});
