import { MenuView } from "@expo/ui/community/menu";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { PressableScale } from "pressto";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { useWatchlistMembership } from "@/hooks/watchlist/use-watchlist-membership";
import { releaseYear, truncate } from "@/lib/format";
import { hapticTap } from "@/lib/haptics";
import { mediaDetailHref } from "@/lib/navigation";
import { tmdbImageUrl, type TmdbMovieSummary } from "@/lib/tmdb";

interface PosterCardProps {
  movie: TmdbMovieSummary;
  width: number;
  showMeta?: boolean;
}

export function PosterCard({ movie, width, showMeta = true }: PosterCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const watchlist = useWatchlistMembership(movie.id, movie.media_type);
  const uri = tmdbImageUrl(
    movie.poster_path ?? movie.backdrop_path,
    width >= 180 ? "w500" : "w342",
  );

  const title = truncate(movie.title ?? movie.original_title ?? "Untitled", 22);
  const meta = releaseYear(movie.release_date);

  function handlePress() {
    hapticTap();
  }

  function handleMenuAction(event: { nativeEvent: { event: string } }) {
    if (event.nativeEvent.event !== "toggle-watchlist") return;
    hapticTap();
    watchlist.toggle().catch(() => {});
  }

  return (
    <MenuView
      shouldOpenOnLongPress
      actions={[
        {
          id: "toggle-watchlist",
          title: watchlist.isInWatchlist ? t("watchlist.remove") : t("watchlist.add"),
          image: watchlist.isInWatchlist ? "bookmark.slash" : "bookmark",
        },
      ]}
      onPressAction={handleMenuAction}>
      <Link href={mediaDetailHref(movie)} asChild>
        <PressableScale onPress={handlePress} style={StyleSheet.flatten([styles.card, { width }])}>
          <Link.AppleZoom>
            <Image
              source={uri ? { uri } : undefined}
              style={StyleSheet.flatten([
                styles.image,
                {
                  width,
                  height: width * 1.5,
                  backgroundColor: theme.backgroundElement,
                },
              ])}
              contentFit="cover"
              transition={200}
            />
          </Link.AppleZoom>
          <View style={styles.caption}>
            <Text size="sm" weight="semibold">
              {title}
            </Text>
            {showMeta && meta ? (
              <Text size="xs" weight="regular" color={theme.textSecondary}>
                {meta}
              </Text>
            ) : null}
          </View>
        </PressableScale>
      </Link>
    </MenuView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: SPACING.SM,
  },
  image: {
    borderRadius: BORDER_RADIUS.MD,
    borderCurve: "continuous",
  },
  caption: {
    gap: SPACING.XS,
    paddingHorizontal: SPACING.XS,
  },
});
