import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { truncate } from "@/lib/format";
import { hapticTap } from "@/lib/haptics";
import { mediaDetailHref } from "@/lib/navigation";
import { tmdbImageUrl, type TmdbMovieSummary } from "@/lib/tmdb";

interface PosterCardProps {
  movie: TmdbMovieSummary;
  width: number;
  showMeta?: boolean;
}

export function PosterCard({ movie, width, showMeta = true }: PosterCardProps) {
  const theme = useTheme();
  const uri = tmdbImageUrl(
    movie.poster_path ?? movie.backdrop_path,
    width >= 180 ? "w500" : "w342",
  );

  const title = truncate(movie.title ?? movie.original_title ?? "Untitled", 22);
  const year = movie.release_date?.slice(0, 4);
  const rating =
    typeof movie.vote_average === "number" && movie.vote_average > 0
      ? movie.vote_average.toFixed(1)
      : undefined;
  const meta = [year, rating ? `★ ${rating}` : null].filter(Boolean).join("  ·  ");

  function handlePress() {
    hapticTap();
  }

  return (
    <Link href={mediaDetailHref(movie)} asChild>
      <Pressable onPress={handlePress} style={StyleSheet.flatten([styles.card, { width }])}>
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
      </Pressable>
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
