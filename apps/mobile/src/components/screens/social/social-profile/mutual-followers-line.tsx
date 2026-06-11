import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";

import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import type { SocialProfile } from "@/services/social";

// "Followed by Marie and 3 others" — people the viewer follows who follow this
// profile. Tapping opens the profile's followers list.
export function MutualFollowersLine({
  profile,
  onPress,
}: {
  profile: SocialProfile;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const mutuals = profile.mutual_followers ?? [];
  const total = profile.mutual_followers_count ?? 0;
  if (mutuals.length === 0 || total === 0) return null;

  const first = mutuals[0].full_name;
  const second = mutuals[1]?.full_name;
  const others = total - 1;
  const label =
    total === 1
      ? t("social.followedBy", { name: first })
      : total === 2 && second
        ? t("social.followedByTwo", { first, second })
        : t("social.followedByOthers", { name: first, count: others, plural: others === 1 ? "" : "s" });

  return (
    <Pressable
      onPress={() => {
        hapticTap();
        onPress();
      }}
      style={styles.line}>
      <Text size="sm" color={theme.textSecondary} align="center">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  line: {
    alignItems: "center",
  },
});
