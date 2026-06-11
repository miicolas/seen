import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { MetricPill } from "@/components/ui/metric-pill";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection } from "@/lib/haptics";
import type { ConnectionsKind } from "@/lib/navigation";
import { profileAvatarUrl } from "@/services/profiles";
import type { SocialProfile } from "@/services/social";

import { FollowPill } from "../follow-pill";
import { MutualFollowersLine } from "./mutual-followers-line";

function CountStat({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={
        onPress
          ? () => {
              hapticSelection();
              onPress();
            }
          : undefined
      }
      disabled={!onPress}
      style={styles.stat}>
      <Text size="xl" weight="bold" color={theme.text}>
        {String(value)}
      </Text>
      <Text size="sm" color={theme.textSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}

// Apple Music-style profile header: centered avatar, identity, mutuals line,
// stat row (followers / following / titles seen) and the follow pill.
export function ProfileHeader({
  profile,
  onOpenConnections,
}: {
  profile: SocialProfile;
  onOpenConnections: (kind: ConnectionsKind) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex, getBackgroundColor } = useAccentColor();

  return (
    <View style={styles.header}>
      <ProfileAvatar
        uri={profileAvatarUrl(profile)}
        name={profile.full_name}
        size={112}
        locked={profile.profile_visibility === "followers"}
      />

      <View style={styles.identity}>
        <Text size="3xl" weight="bold" color={theme.text} align="center" numberOfLines={2}>
          {profile.full_name}
        </Text>
        <Text size="lg" color={theme.textSecondary}>
          {`@${profile.username}`}
        </Text>
        {profile.follows_me ? (
          <MetricPill
            icon="person.crop.circle.badge.checkmark"
            label={t("social.followsYou")}
            tint={accentHex}
            background={getBackgroundColor()}
          />
        ) : null}
      </View>

      <MutualFollowersLine profile={profile} onPress={() => onOpenConnections("followers")} />

      <View style={styles.stats}>
        <CountStat
          value={profile.followers_count}
          label={t("social.followers")}
          onPress={() => onOpenConnections("followers")}
        />
        <CountStat
          value={profile.following_count}
          label={t("social.followingTitle")}
          onPress={() => onOpenConnections("following")}
        />
        <CountStat value={profile.seen_count ?? 0} label={t("social.seenStat")} />
      </View>

      <FollowPill card={profile} size="md" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: SPACING.LG,
    gap: SPACING.MD,
  },
  identity: {
    alignItems: "center",
    alignSelf: "stretch",
    gap: SPACING.XS,
  },
  stats: {
    flexDirection: "row",
    gap: SPACING.XL,
  },
  stat: {
    alignItems: "center",
    gap: SPACING.XXS,
  },
});
