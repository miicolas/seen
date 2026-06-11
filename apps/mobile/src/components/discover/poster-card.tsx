import { Image } from "expo-image";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { useLikesMembership } from "@/hooks/likes/use-likes-membership";
import { useNotInterestedMembership } from "@/hooks/not-interested/use-not-interested-membership";
import { useWatchlistMembership } from "@/hooks/watchlist/use-watchlist-membership";
import { releaseYear, truncate } from "@/lib/format";
import { hapticDelete, hapticTap } from "@/lib/haptics";
import { mediaDetailHref, type MediaRouteBase } from "@/lib/navigation";
import { tmdbImageUrl, type TmdbMovieSummary } from "@/lib/tmdb";

interface PosterCardProps {
  movie: TmdbMovieSummary;
  width: number;
  showMeta?: boolean;
  base?: MediaRouteBase;
}

// Tap + long-press context menu use expo-router's Link.Trigger/Link.Menu —
// wrapping the Link in an external MenuView swallows simple taps.
export function PosterCard({ movie, width, showMeta = true, base = "discover" }: PosterCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const watchlist = useWatchlistMembership(movie.id, movie.media_type);
  const likes = useLikesMembership(movie.id, movie.media_type);
  const notInterested = useNotInterestedMembership(movie.id, movie.media_type);
  const uri = tmdbImageUrl(
    movie.poster_path ?? movie.backdrop_path,
    width >= 180 ? "w500" : "w342",
  );

  const title = truncate(movie.title ?? movie.original_title ?? "Untitled", 18);
  const meta = releaseYear(movie.release_date);

  return (
    <Link href={mediaDetailHref(movie, base)} asChild>
      <Link.Trigger withAppleZoom>
        <Pressable onPress={() => hapticTap()} style={StyleSheet.flatten([styles.card, { width }])}>
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
        </Pressable>
      </Link.Trigger>
      <Link.Menu>
        <Link.MenuAction
          icon={watchlist.isInWatchlist ? "bookmark.slash.fill" : "bookmark"}
          onPress={() => {
            hapticTap();
            watchlist.toggle().catch(() => {});
          }}>
          {watchlist.isInWatchlist ? t("watchlist.remove") : t("watchlist.add")}
        </Link.MenuAction>
        <Link.MenuAction
          icon={likes.isLiked ? "heart.fill" : "heart"}
          onPress={() => {
            hapticTap();
            likes.toggleLike().catch(() => {});
          }}>
          {likes.isLiked ? t("likes.unlike") : t("likes.like")}
        </Link.MenuAction>
        <Link.MenuAction
          icon={notInterested.isDismissed ? "eye" : "eye.slash"}
          destructive={!notInterested.isDismissed}
          onPress={() => {
            hapticDelete();
            notInterested.toggle().catch(() => {});
          }}>
          {notInterested.isDismissed ? t("notInterested.undismiss") : t("notInterested.dismiss")}
        </Link.MenuAction>
      </Link.Menu>
    </Link>
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
