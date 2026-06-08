import { Pressable, StyleSheet, View } from "react-native";

import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import { profileAvatarUrl } from "@/services/profiles";
import type { SocialProfileCard } from "@/services/social";

import { FollowButton } from "./follow-button";

const AVATAR_SIZE = 48;

// A tappable row showing a profile (avatar, name, @username, optional subtitle)
// with the follow control on the trailing edge. Shared by search, contacts,
// requests and follower/following lists.
export function ProfileCardRow({
  card,
  subtitle,
  onPress,
}: {
  card: SocialProfileCard;
  subtitle?: string | null;
  onPress?: () => void;
}) {
  const theme = useTheme();

  const handlePress = () => {
    if (!onPress) return;
    hapticTap();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} disabled={!onPress} style={styles.row}>
      <ProfileAvatar uri={profileAvatarUrl(card)} name={card.full_name} size={AVATAR_SIZE} />
      <View style={styles.body}>
        <Text size="md" weight="bold" color={theme.text} numberOfLines={1} fillWidth>
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
      <FollowButton card={card} />
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
