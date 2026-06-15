import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { PosterCard } from "@/components/discover/poster-card";
import { Shelf } from "@/components/discover/shelf";
import { SPACING } from "@/constants/design-tokens";
import { useMediaRecommendations } from "@/hooks/tmdb/use-media-recommendations";
import type { MediaType } from "@/lib/tmdb";
import type { MediaRouteBase } from "@/lib/navigation";

import { DetailSection } from "./detail-section";

export function RecommendationsSection({
  tmdbId,
  mediaType,
  base,
}: {
  tmdbId: number;
  mediaType: MediaType;
  base: MediaRouteBase;
}) {
  const { t } = useTranslation();
  const { media } = useMediaRecommendations(tmdbId, mediaType);

  if (media.length === 0) return null;

  return (
    <DetailSection title={t("mediaDetail.youMayAlsoLike")}>
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
    </DetailSection>
  );
}

const styles = StyleSheet.create({
  // The parallax body pads horizontally by SPACING.MD; break out so the shelf
  // spans edge-to-edge like the cast row, letting Shelf own its own padding.
  shelf: {
    marginHorizontal: -SPACING.MD,
  },
});
