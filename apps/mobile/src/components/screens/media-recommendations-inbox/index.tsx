import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenToolbar } from "@/components/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useReceivedRecommendations } from "@/hooks/media-recommendations/use-received-recommendations";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import { mediaDetailHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb/images";
import type { ReceivedRecommendation } from "@/services/media-recommendations";

export function MediaRecommendationsInbox() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { inbox, markRead } = useReceivedRecommendations();
  const items = useMemo(() => inbox.data ?? [], [inbox.data]);

  // Mark each unread entry read once the inbox is viewed; the ref keeps the
  // effect from re-firing for the same row after the list refetches.
  const processed = useRef<Set<string>>(new Set());
  const markReadMutate = markRead.mutate;
  useEffect(() => {
    for (const item of items) {
      if (!item.read_at && !processed.current.has(item.id)) {
        processed.current.add(item.id);
        markReadMutate(item.id);
      }
    }
  }, [items, markReadMutate]);

  function close() {
    hapticTap();
    router.back();
  }

  function open(item: ReceivedRecommendation) {
    hapticTap();
    router.back();
    router.push(
      mediaDetailHref(
        {
          id: item.tmdb_id,
          media_type: item.media_type,
          title: item.title,
          poster_path: item.poster_path,
        },
        "search",
      ),
    );
  }

  const renderItem = ({ item }: { item: ReceivedRecommendation }) => (
    <Pressable
      style={[styles.row, { backgroundColor: theme.backgroundElement }]}
      accessibilityLabel={item.title}
      onPress={() => open(item)}>
      <Image
        source={{ uri: tmdbImageUrl(item.poster_path, "w154") }}
        style={styles.poster}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.rowText}>
        <Text size="xs" weight="medium" color={theme.textSecondary} numberOfLines={1} inline>
          {t("recommend.fromSender", {
            name: item.sender.full_name ?? item.sender.username ?? "",
          })}
        </Text>
        <Text size="sm" weight="semibold" numberOfLines={2} inline>
          {item.title}
        </Text>
        {item.message ? (
          <Text size="sm" weight="regular" color={theme.textSecondary} numberOfLines={3} inline>
            {item.message}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  const renderEmpty = () => {
    if (inbox.isLoading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <EmptyState icon="paperplane" title={t("recommend.inboxEmpty")} />
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenToolbar placement="left" actions={[{ key: "close", icon: "xmark", onPress: close }]} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmpty}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + SPACING.LG },
          items.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    width: "100%",
    alignSelf: "center",
    padding: SPACING.MD,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: SPACING.SM,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.LG,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
    padding: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
  },
  poster: {
    width: 44,
    height: 62,
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: "#00000022",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
