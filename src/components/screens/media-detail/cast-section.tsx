import { Image } from "expo-image";
import { ScrollView, StyleSheet, View } from "react-native";

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
      <ScrollView
        horizontal
        style={styles.edgeToEdgeScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.castRow,
          styles.edgeToEdgeScrollContent,
        ]}>
        {cast.map((member) => (
          <CastAvatar key={member.id} member={member} />
        ))}
      </ScrollView>
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
  castRow: {
    gap: SPACING.MD,
    paddingVertical: SPACING.XS,
  },
  edgeToEdgeScroll: {
    marginHorizontal: -SPACING.MD,
  },
  edgeToEdgeScrollContent: {
    paddingHorizontal: SPACING.MD,
  },
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
