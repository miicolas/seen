import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { HorizontalScrollRow } from "@/components/ui/horizontal-scroll-row";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useFollowList, type FollowListKind } from "@/hooks/social/use-follow-list";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection } from "@/lib/haptics";
import { connectionsHref, socialProfileHref } from "@/lib/navigation";
import { profileAvatarUrl } from "@/services/profiles";

const AVATAR_SIZE = 64;
const PREVIEW_COUNT = 12;

// Apple-Music-style horizontal strip of follower / following avatars for a
// profile. Renders nothing until there is at least one connection.
export function ConnectionStrip({
  profileId,
  kind,
}: {
  profileId: string | undefined;
  kind: FollowListKind;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const list = useFollowList(profileId, kind, PREVIEW_COUNT);

  const title = kind === "followers" ? t("social.followersTitle") : t("social.followingTitle");

  const openProfile = useCallback(
    (id: string) => {
      hapticSelection();
      router.push(socialProfileHref(id));
    },
    [router],
  );

  const seeAll = useCallback(() => {
    if (!profileId) return;
    hapticSelection();
    router.push(connectionsHref(profileId, kind, title));
  }, [kind, profileId, router, title]);

  if (list.data.length === 0) return null;

  return (
    <View style={styles.section}>
      <Pressable style={styles.header} onPress={seeAll}>
        <Text size="2xl" weight="bold" color={theme.text}>
          {title}
        </Text>
        <Text size="sm" weight="semibold" color={theme.textSecondary}>
          {t("social.seeAll")}
        </Text>
      </Pressable>

      <HorizontalScrollRow gap={SPACING.MD}>
        {list.data.map((card) => (
          <Pressable key={card.id} style={styles.item} onPress={() => openProfile(card.id)}>
            <ProfileAvatar uri={profileAvatarUrl(card)} name={card.full_name} size={AVATAR_SIZE} />
            <Text size="xs" color={theme.textSecondary} align="center" numberOfLines={1}>
              {card.full_name}
            </Text>
          </Pressable>
        ))}
      </HorizontalScrollRow>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.SM,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  item: {
    width: AVATAR_SIZE,
    alignItems: "center",
    gap: SPACING.XS,
  },
});
