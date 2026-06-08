import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { releaseYear } from "@/lib/format";
import { tmdbImageUrl } from "@/lib/tmdb";
import type { SeedItem } from "@/services/preferences";

type Props = {
  item: SeedItem;
  width: number;
  height: number;
};

export function SwipeCard({ item, width, height }: Props) {
  const uri = tmdbImageUrl(item.poster_path, "w500");
  const year = releaseYear(item.release_date);
  const title = item.title ?? item.original_title ?? "";

  return (
    <View style={[styles.card, { width, height }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.88)"]} style={styles.scrim} />
      <View style={styles.meta}>
        <Text inline size="2xl" weight="bold" color="#ffffff">
          {title}
        </Text>
        {year ? (
          <Text inline size="sm" weight="regular" color="rgba(255,255,255,0.85)">
            {year}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.LG,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  placeholder: {
    backgroundColor: "#1c1c1e",
  },
  scrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "45%",
  },
  meta: {
    position: "absolute",
    left: SPACING.MD,
    right: SPACING.MD,
    bottom: SPACING.MD,
    gap: SPACING.XXS,
  },
});
