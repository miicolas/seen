import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import { profileAvatarUrl } from "@/services/profiles";
import type { FollowRequest } from "@/services/social";

export function RequestRow({
  request,
  onApprove,
  onReject,
  onOpen,
  disabled,
}: {
  request: FollowRequest;
  onApprove: () => void;
  onReject: () => void;
  onOpen: () => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const card = request.requester;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        style={styles.identity}
        onPress={() => {
          hapticTap();
          onOpen();
        }}>
        <ProfileAvatar uri={profileAvatarUrl(card)} name={card.full_name} size={44} />
        <View style={styles.body}>
          <Text size="md" weight="bold" color={theme.text} numberOfLines={1} fillWidth>
            {card.full_name}
          </Text>
          <Text size="sm" color={theme.textSecondary} numberOfLines={1} fillWidth>
            {`@${card.username}`}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            title={t("social.approve")}
            onPress={onApprove}
            variant="solid"
            size="sm"
            width="fill"
            disabled={disabled}
          />
        </View>
        <View style={styles.action}>
          <Button
            title={t("social.reject")}
            onPress={onReject}
            variant="soft"
            size="sm"
            width="fill"
            disabled={disabled}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    padding: SPACING.MD,
    gap: SPACING.MD,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
  },
  body: {
    flex: 1,
    gap: SPACING.XXS,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.SM,
  },
  action: {
    flex: 1,
  },
});
