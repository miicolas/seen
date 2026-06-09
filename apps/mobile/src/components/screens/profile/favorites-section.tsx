import { Image as ExpoImage } from "expo-image";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, OPACITY, SPACING } from "@/constants/design-tokens";
import { useFavorites } from "@/hooks/likes/use-favorites";
import { useTheme } from "@/hooks/use-theme";
import { mediaDetailHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb";

const POSTER_WIDTH = 104;
const POSTER_HEIGHT = 156;

export function FavoritesSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { items } = useFavorites();

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text size="2xl" weight="bold" color={theme.text} fillWidth>
        {t("profile.favoritesTitle")}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {items.map((item) => {
          const posterUri = tmdbImageUrl(
            item.media.poster_path ?? item.media.backdrop_path,
            "w342",
          );
          return (
            <Link
              key={`${item.media_type}:${item.tmdb_id}`}
              href={mediaDetailHref(item.media, "profile")}
              asChild>
              <Pressable
                style={({ pressed }) => [styles.tile, { opacity: pressed ? OPACITY.DISABLED : 1 }]}>
                <ExpoImage
                  source={posterUri ? { uri: posterUri } : undefined}
                  style={[styles.poster, { backgroundColor: theme.backgroundElement }]}
                  contentFit="cover"
                />
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  row: {
    gap: SPACING.SM,
    paddingVertical: SPACING.XS,
  },
  tile: {
    width: POSTER_WIDTH,
  },
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: BORDER_RADIUS.MD,
    borderCurve: "continuous",
  },
});
