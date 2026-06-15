import { StyleSheet, View } from "react-native";

import { PosterCard } from "@/components/discover/poster-card";
import { Shelf } from "@/components/discover/shelf";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import type { MediaRouteBase } from "@/lib/navigation";
import type { TmdbMovieSummary } from "@/lib/tmdb";

export function FilmographySection({
  title,
  media,
  base,
}: {
  title: string;
  media: TmdbMovieSummary[];
  base: MediaRouteBase;
}) {
  const theme = useTheme();

  if (media.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text size="lg" weight="bold" color={theme.text} fillWidth>
        {title}
      </Text>
      <View style={styles.shelf}>
        <Shelf
          hideHeader
          data={media}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          renderItem={(item, _index, cardWidth) => (
            <PosterCard movie={item} width={cardWidth} base={base} />
          )}
          visibleCards={3}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.SM,
    paddingTop: SPACING.MD,
  },
  // Break out of the parallax body's horizontal padding so the shelf spans
  // edge-to-edge and Shelf owns its own padding.
  shelf: {
    marginHorizontal: -SPACING.MD,
  },
});
