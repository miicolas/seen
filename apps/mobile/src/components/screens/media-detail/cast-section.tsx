import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { HorizontalScrollRow } from "@/components/ui/horizontal-scroll-row";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { truncate } from "@/lib/format";
import { tmdbImageUrl } from "@/lib/tmdb";

import { DetailSection } from "./detail-section";
import type { CastMember } from "./types";

export function CastSection({ cast }: { cast: CastMember[] }) {
  if (cast.length === 0) return null;

  return (
    <DetailSection title="Cast">
      <HorizontalScrollRow gap={SPACING.MD} edgeToEdge>
        {cast.map((member) => (
          <CastAvatar key={member.id} member={member} />
        ))}
      </HorizontalScrollRow>
    </DetailSection>
  );
}

function CastAvatar({ member }: { member: CastMember }) {
  const theme = useTheme();
  const avatar = tmdbImageUrl(member.profile_path, "w185");

  return (
    <View style={styles.castItem}>
      <Image
        source={avatar ? { uri: avatar } : undefined}
        style={[styles.castAvatar, { backgroundColor: theme.backgroundElement }]}
        contentFit="cover"
        transition={200}
      />
      <Text
        size="xs"
        weight="semibold"
        align="center"
        color={theme.text}
        fillWidth
        numberOfLines={1}>
        {truncate(member.name, 18)}
      </Text>
      {member.character ? (
        <Text
          size="xs"
          weight="regular"
          align="center"
          color={theme.textSecondary}
          fillWidth
          numberOfLines={1}>
          {truncate(member.character, 18)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  castItem: {
    width: 88,
    gap: SPACING.XS,
  },
  castAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
});
