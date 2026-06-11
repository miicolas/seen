import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { PosterCard } from "@/components/discover/poster-card";
import { Shelf } from "@/components/discover/shelf";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import type { FriendsWatchedEntry } from "@/services/recommendations";

export function FriendsWatchedShelf({ entries }: { entries: FriendsWatchedEntry[] }) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (entries.length === 0) return null;

  return (
    <Shelf
      title={t("home.sections.friendsWatched")}
      data={entries}
      keyExtractor={(entry, index) => `${entry.media_type}-${entry.id}-${index}`}
      visibleCards={2.2}
      impressionSource="social"
      impressionItem={(entry) => ({ tmdbId: entry.id, mediaType: entry.media_type })}
      renderItem={(entry, _index, cardWidth) => (
        <View style={[styles.card, { width: cardWidth }]}>
          <PosterCard movie={entry} width={cardWidth} showMeta={false} base="home" />
          {entry.friendReason ? (
            <Text size="xs" weight="medium" color={theme.textSecondary} numberOfLines={1} inline>
              {entry.friendReason}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    gap: SPACING.XS,
  },
});
