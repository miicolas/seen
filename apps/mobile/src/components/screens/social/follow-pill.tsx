import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";

import { BORDER_RADIUS, COMPONENT_HEIGHT, FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useFollowActions } from "@/hooks/social/use-follow-actions";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import type { SocialProfileCard } from "@/services/social";

type PillSize = "sm" | "md";

const PILL_HEIGHT: Record<PillSize, number> = {
  sm: COMPONENT_HEIGHT.XS,
  md: COMPONENT_HEIGHT.SM,
};

const PILL_MIN_WIDTH: Record<PillSize, number> = {
  sm: 86,
  md: 120,
};

// Apple Music-style follow capsule: filled accent while not following, subdued
// neutral once following/requested. Pure RN so it stays reactive inside
// RNHostView rows and plain ScrollViews alike.
export function FollowPill({ card, size = "sm" }: { card: SocialProfileCard; size?: PillSize }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex } = useAccentColor();
  const { follow, unfollow, isPending } = useFollowActions(card.id);

  if (card.is_me) return null;

  const isActive = card.is_following || card.request_status === "pending";
  const title = card.is_following
    ? t("social.following")
    : card.request_status === "pending"
      ? t("social.requested")
      : card.follows_me
        ? t("social.followBack")
        : t("social.follow");

  const backgroundColor = isActive ? theme.backgroundElement : accentHex;
  const textColor = isActive ? theme.textSecondary : "#FFFFFF";

  const onPress = () => {
    hapticTap();
    if (isActive) void unfollow();
    else void follow();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isPending}
      hitSlop={SPACING.SM}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor,
          height: PILL_HEIGHT[size],
          minWidth: PILL_MIN_WIDTH[size],
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      {isPending ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            { color: textColor, fontSize: size === "sm" ? FONT_SIZE.SM : FONT_SIZE.MD },
          ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.FULL,
    borderCurve: "continuous",
  },
  label: {
    fontWeight: "600",
  },
});
