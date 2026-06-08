import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { useWatchProviders } from "@/hooks/watch-providers/use-watch-providers";
import { hapticTap } from "@/lib/haptics";
import { tmdbImageUrl, type MediaType, type TmdbProviderRef } from "@/lib/tmdb";
import { track } from "@/services/events";

import { DetailSection } from "./detail-section";

const LOGO_SIZE = 56;

type Props = {
  mediaType: MediaType;
  tmdbId: number;
};

export function WatchProvidersSection({ mediaType, tmdbId }: Props) {
  const { t } = useTranslation();
  const { data } = useWatchProviders(mediaType, tmdbId);

  const providers = data?.flatrate ?? [];
  if (providers.length === 0) return null;

  return (
    <DetailSection title={t("mediaDetail.whereToWatch")}>
      <View style={styles.row}>
        {providers.map((provider) => (
          <ProviderLogo
            key={provider.providerId}
            provider={provider}
            mediaType={mediaType}
            tmdbId={tmdbId}
          />
        ))}
      </View>
    </DetailSection>
  );
}

function ProviderLogo({
  provider,
  mediaType,
  tmdbId,
}: {
  provider: TmdbProviderRef;
  mediaType: MediaType;
  tmdbId: number;
}) {
  const theme = useTheme();
  const uri = tmdbImageUrl(provider.logoPath, "w92");

  function handlePress() {
    hapticTap();
    track("clicked_streaming", {
      tmdbId,
      mediaType,
      metadata: { provider_id: provider.providerId, provider_name: provider.name },
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={provider.name}
      onPress={handlePress}
      style={styles.item}>
      <Image
        source={uri ? { uri } : undefined}
        style={[styles.logo, { backgroundColor: theme.backgroundElement }]}
        contentFit="cover"
        transition={200}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.SM,
  },
  item: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 12,
  },
});
