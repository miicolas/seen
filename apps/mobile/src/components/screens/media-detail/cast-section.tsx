import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { HorizontalScrollRow } from "@/components/ui/horizontal-scroll-row";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { truncate } from "@/lib/format";
import { hapticTap } from "@/lib/haptics";
import { personDetailHref, type MediaRouteBase } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb";

import { DetailSection } from "./detail-section";
import type { CastMember } from "./types";

export function CastSection({ cast, base }: { cast: CastMember[]; base: MediaRouteBase }) {
  if (cast.length === 0) return null;

  return (
    <DetailSection title="Cast">
      <HorizontalScrollRow gap={SPACING.MD} edgeToEdge>
        {cast.map((member) => (
          <CastAvatar key={member.id} member={member} base={base} />
        ))}
      </HorizontalScrollRow>
    </DetailSection>
  );
}

function CastAvatar({ member, base }: { member: CastMember; base: MediaRouteBase }) {
  const theme = useTheme();
  const avatar = tmdbImageUrl(member.profile_path, "w185");

  return (
    <Link href={personDetailHref(member.id, member.name, base)} asChild>
      <Link.Trigger withAppleZoom>
        <Pressable
          style={styles.castItem}
          accessibilityRole="button"
          accessibilityLabel={member.name}
          onPress={() => hapticTap()}>
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
        </Pressable>
      </Link.Trigger>
    </Link>
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
