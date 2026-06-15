import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/navigation";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/use-theme";

import { OverviewSection } from "../media-detail/overview-section";
import { MediaParallaxHeader } from "../media-detail/media-parallax-header";
import { FilmographySection } from "./filmography-section";
import { PersonSummary } from "./person-summary";
import { usePersonDetailViewModel } from "./use-person-detail-view-model";

export function PersonDetail() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const vm = usePersonDetailViewModel();

  return (
    <>
      <ScreenHeader />
      <Stack.Title>{vm.name}</Stack.Title>

      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <MediaParallaxHeader
          backdropUri={null}
          posterUri={vm.profileUri}
          headerHeight={370}
          bottomInset={insets.bottom}>
          <PersonSummary name={vm.name} role={vm.role} />

          {vm.error && !vm.isLoading ? (
            <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
              {vm.error}
            </Text>
          ) : null}

          <OverviewSection overview={vm.biography} title={t("person.biography")} />

          <FilmographySection title={t("person.acting")} media={vm.acting} base={vm.base} />

          <FilmographySection title={t("person.crew")} media={vm.crew} base={vm.base} />

          {vm.isLoading ? (
            <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
              Loading…
            </Text>
          ) : null}
        </MediaParallaxHeader>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
