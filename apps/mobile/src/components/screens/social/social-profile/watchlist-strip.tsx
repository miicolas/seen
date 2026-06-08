import { Image as ExpoImage } from "expo-image";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useSocialProfileWatchlist } from "@/hooks/social/use-social-profile-watchlist";
import { useTheme } from "@/hooks/use-theme";
import { mediaDetailHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb";

const POSTER_WIDTH = 92;
const POSTER_HEIGHT = 138;

// A horizontal poster strip of the profile's visible watchlist. Hidden entirely
// when the viewer can see nothing.
export function WatchlistStrip({ profileId }: { profileId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { items } = useSocialProfileWatchlist(profileId);

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text size="2xl" weight="bold" color={theme.text} fillWidth>
        {t("social.watchlistTitle")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}>
        {items.map((item) => (
          <Link key={item.id} href={mediaDetailHref(item.media, "profile")} asChild>
            <ExpoImage
              source={{ uri: tmdbImageUrl(item.media.poster_path, "w342") ?? undefined }}
              style={StyleSheet.flatten([
                styles.poster,
                { backgroundColor: theme.backgroundElement },
              ])}
              contentFit="cover"
              transition={200}
            />
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.MD,
  },
  strip: {
    gap: SPACING.SM,
  },
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: BORDER_RADIUS.SM,
    borderCurve: "continuous",
    overflow: "hidden",
  },
});
