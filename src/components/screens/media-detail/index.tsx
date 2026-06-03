import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/use-theme";

import { CastSection } from "./cast-section";
import { DetailSection } from "./detail-section";
import { InfoSection } from "./info-section";
import { MediaActions } from "./media-actions";
import { MediaDetailToolbar } from "./media-detail-toolbar";
import { MediaParallaxHeader } from "./media-parallax-header";
import { MediaSummary } from "./media-summary";
import { RatingsSection } from "./ratings-section";
import { useMediaDetailViewModel } from "./use-media-detail-view-model";

export function MediaDetail() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const vm = useMediaDetailViewModel();

  const handleRate = useCallback(
    () => vm.openReview(vm.myStars || undefined),
    [vm],
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <MediaDetailToolbar
        hasReview={vm.hasReview}
        myStars={vm.myStars}
        onReview={vm.openReview}
        onShare={vm.shareTitle}
        onOpenTmdb={vm.openTmdb}
      />

      <MediaParallaxHeader
        backdropUri={vm.backdropUri}
        posterUri={vm.posterUri}
        headerHeight={vm.width * 0.95}
        bottomInset={insets.bottom}>
        <MediaSummary
          title={vm.title}
          tagline={vm.tagline}
          year={vm.year}
          runtime={vm.runtime}
          genres={vm.genres}
          myStars={vm.myStars}
          hasReview={vm.hasReview}
        />

        <MediaActions
          hasReview={vm.hasReview}
          accentHex={vm.accentHex}
          onRate={handleRate}
          onShare={vm.shareTitle}
        />

        {vm.error && !vm.detail ? (
          <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
            {vm.error}
          </Text>
        ) : null}

        {vm.detail?.overview ? (
          <DetailSection title="About">
            <Text size="md" weight="regular" color={theme.textSecondary} fillWidth>
              {vm.detail.overview}
            </Text>
          </DetailSection>
        ) : null}

        <CastSection cast={vm.cast} />

        <InfoSection rows={vm.infoRows} />

        <RatingsSection
          stats={vm.stats}
          histogram={vm.histogram}
          accentHex={vm.accentHex}
          reviews={vm.reviews}
        />

        {vm.isLoading && !vm.detail ? (
          <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
            Loading…
          </Text>
        ) : null}
      </MediaParallaxHeader>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
