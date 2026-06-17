import { Image } from "expo-image";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Shelf } from "@/components/discover/shelf";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { RatingPill } from "@/components/ui/rating-pill";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import { activityDetailHref, type MediaRouteBase } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb";
import { profileAvatarUrl } from "@/services/profiles";
import type { SocialActivityItem } from "@/services/social";

export function FriendsRatedShelf({
  entries,
  base = "search",
}: {
  entries: SocialActivityItem[];
  base?: MediaRouteBase;
}) {
  const { t } = useTranslation();

  return (
    <Shelf
      title={t("search.friendsRated")}
      data={entries}
      keyExtractor={(entry) => `${entry.kind}-${entry.id}`}
      visibleCards={2.2}
      impressionSource="social"
      impressionItem={(entry) => ({ tmdbId: entry.tmdb_id, mediaType: entry.media_type })}
      renderItem={(entry, _index, cardWidth) => (
        <FriendsRatedCard entry={entry} width={cardWidth} base={base} />
      )}
    />
  );
}

function FriendsRatedCard({
  entry,
  width,
  base,
}: {
  entry: SocialActivityItem;
  width: number;
  base: MediaRouteBase;
}) {
  const theme = useTheme();
  const posterUri = tmdbImageUrl(entry.poster_path, width >= 180 ? "w500" : "w342");
  const displayName = entry.author.full_name || entry.author.username || "";

  return (
    <Link href={activityDetailHref(entry, base)} asChild>
      <Link.Trigger withAppleZoom>
        <Pressable onPress={() => hapticTap()} style={[styles.card, { width }]}>
          <Image
            source={posterUri ? { uri: posterUri } : undefined}
            style={[
              styles.poster,
              {
                width,
                height: width * 1.5,
                backgroundColor: theme.backgroundElement,
              },
            ]}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.caption}>
            <Text size="sm" weight="semibold" color={theme.text} numberOfLines={1}>
              {entry.media_title}
            </Text>
            <View style={styles.metaRow}>
              <ProfileAvatar uri={profileAvatarUrl(entry.author)} name={displayName} size={20} />
              <View style={styles.metaText}>
                <Text
                  size="xs"
                  weight="medium"
                  color={theme.textSecondary}
                  numberOfLines={1}
                  fillWidth>
                  {displayName}
                </Text>
              </View>
            </View>
            {entry.rating != null ? <RatingPill rating={entry.rating} /> : null}
          </View>
        </Pressable>
      </Link.Trigger>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: SPACING.SM,
  },
  poster: {
    borderRadius: BORDER_RADIUS.MD,
    borderCurve: "continuous",
  },
  caption: {
    gap: SPACING.XS,
    paddingHorizontal: SPACING.XS,
  },
  metaRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.XS,
  },
  metaText: {
    flex: 1,
    minWidth: 0,
  },
});
