import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import { profileAvatarUrl } from "@/services/profiles";
import type { SocialProfileCard } from "@/services/social";

import { buildProfileSubtitle } from "./build-profile-subtitle";
import { FollowPill } from "./follow-pill";

const AVATAR_SIZE = 44;

// A tappable row showing a profile (avatar, name, @username + social context)
// with the follow pill on the trailing edge. Shared by search, contacts,
// requests and follower/following lists. Pure RN so it renders identically in
// RNHostView list rows and plain ScrollViews.
export function ProfileCardRow({
  card,
  contactName,
  trailing,
  onPress,
}: {
  card: SocialProfileCard;
  contactName?: string | null;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const subtitle = buildProfileSubtitle(t, card, { contactName });

  const handlePress = () => {
    if (!onPress) return;
    hapticTap();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} disabled={!onPress} style={styles.row}>
      <ProfileAvatar uri={profileAvatarUrl(card)} name={card.full_name} size={AVATAR_SIZE} />
      <View style={styles.body}>
        <Text size="md" weight="semibold" color={theme.text} numberOfLines={1} fillWidth>
          {card.full_name}
        </Text>
        <Text size="sm" color={theme.textSecondary} numberOfLines={1} fillWidth>
          {`@${card.username}`}
        </Text>
        {subtitle ? (
          <Text size="xs" color={theme.textSecondary} numberOfLines={1} fillWidth>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? <FollowPill card={card} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
    minHeight: 56,
  },
  body: {
    flex: 1,
    gap: SPACING.XXS,
    justifyContent: "center",
  },
});
