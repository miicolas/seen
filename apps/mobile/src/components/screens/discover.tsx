import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeSyntheticEvent, TextInputFocusEventData } from "react-native";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SFSymbol } from "sf-symbols-typescript";

import { DiscoverContainer } from "@/components/discover/container";
import { SearchResults } from "@/components/discover/search-results";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { hapticSelection } from "@/lib/haptics";
import type { MediaFilter } from "@/lib/tmdb";

const FILTER_OPTIONS: {
  value: MediaFilter;
  labelKey: "filterAll" | "filterMovies" | "filterSeries";
  icon: SFSymbol;
}[] = [
  { value: "all", labelKey: "filterAll", icon: "square.grid.2x2" },
  { value: "movie", labelKey: "filterMovies", icon: "film" },
  { value: "tv", labelKey: "filterSeries", icon: "tv" },
];

export function Discover() {
  const { t } = useTranslation();
  const safeAreaInsets = useSafeAreaInsets();

  const [filter, setFilter] = useState<MediaFilter>("all");
  const [query, setQuery] = useState("");

  const options = useMemo(
    () =>
      FILTER_OPTIONS.map((option) => ({
        ...option,
        label: t(`discover.${option.labelKey}`),
      })),
    [t],
  );

  const isSearching = query.trim().length > 0;
  const bottomInset = safeAreaInsets.bottom + BottomTabInset + Spacing.three;
  const activeOption = options.find((option) => option.value === filter) ?? options[0];

  function handleFilter(value: MediaFilter) {
    setFilter(value);
    hapticSelection();
  }

  function handleSearchText(e: NativeSyntheticEvent<TextInputFocusEventData>) {
    setQuery(e.nativeEvent.text);
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
