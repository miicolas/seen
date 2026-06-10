import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DiscoverSkeleton } from "@/components/discover/discover-skeleton";
import { GlassButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useNotInterestedList } from "@/hooks/not-interested/use-not-interested-list";
import { useFeed } from "@/hooks/recommendations/use-feed";
import { hapticTap } from "@/lib/haptics";

import { FeedSectionShelf } from "./feed-section-shelf";

export function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const { accentHex } = useAccentColor();
  const feed = useFeed();
  const { isDismissed } = useNotInterestedList();

  const bottomInset = safeAreaInsets.bottom + BottomTabInset + Spacing.three;

  if (feed.isLoading) return <DiscoverSkeleton />;

  if (feed.error) {
    return (
      <View style={styles.center}>
        <Text size="sm" weight="medium" align="center">
          {t("home.loadError")}
        </Text>
      </View>
    );
  }

  // Hide dismissed titles immediately; the server drops them on next recompute.
  const sections = (feed.data?.sections ?? [])
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => !isDismissed(entry.id, entry.media_type)),
    }))
    .filter((section) => section.entries.length > 0);

  if (sections.length === 0) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="sparkles"
          title={t("home.empty.title")}
          subtitle={t("home.empty.subtitle")}
          action={
            <View style={styles.emptyActions}>
              <GlassButton
                title={t("home.empty.ctaTaste")}
                onPress={() => {
                  hapticTap();
                  router.push("/(setup)/taste");
                }}
              />
              <GlassButton
                title={t("home.empty.ctaImport")}
                onPress={() => {
                  hapticTap();
                  router.push("/(setup)/import");
                }}
              />
            </View>
          }
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      refreshControl={
        <RefreshControl
          refreshing={feed.isRefetching}
          onRefresh={feed.refetch}
          tintColor={accentHex}
        />
      }>
      {sections.map((section) => (
        <FeedSectionShelf key={section.key} section={section} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: "100%",
  },
  content: {
    gap: SPACING.LG,
    paddingTop: SPACING.SM,
  },
  center: {
    flex: 1,
    paddingVertical: SPACING.XXL,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyActions: {
    alignSelf: "stretch",
    gap: SPACING.SM,
    paddingHorizontal: SPACING.XL,
  },
});
