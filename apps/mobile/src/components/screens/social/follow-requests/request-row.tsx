import { Button, RNHostView, SwipeActions } from "@expo/ui/swift-ui";
import { listRowInsets } from "@expo/ui/swift-ui/modifiers";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import type { FollowRequest } from "@/services/social";

import { ProfileCardRow } from "../profile-card-row";

const ROW_HORIZONTAL_INSET = 64;
const ACTION_SIZE = 32;

function CircleActionButton({
  icon,
  tint,
  background,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  icon: "checkmark" | "xmark";
  tint: string;
  background: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        hapticTap();
        onPress();
      }}
      disabled={disabled}
      hitSlop={SPACING.SM}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.circle,
        { backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}>
      <SymbolView name={icon} size={14} weight="semibold" tintColor={tint} />
    </Pressable>
  );
}

// A follow request as a native list row: requester card with circular ✓ / ✕
// controls on the trailing edge, plus swipe actions as a faster alternative.
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
  const { accentHex } = useAccentColor();
  const { width } = useWindowDimensions();
  const rowWidth = width - ROW_HORIZONTAL_INSET;

  return (
    <SwipeActions modifiers={[listRowInsets({ top: 8, bottom: 8, leading: 16, trailing: 16 })]}>
      <RNHostView matchContents>
        <View style={StyleSheet.flatten([styles.row, { width: rowWidth }])}>
          <ProfileCardRow
            card={request.requester}
            onPress={onOpen}
            trailing={
              <View style={styles.actions}>
                <CircleActionButton
                  icon="checkmark"
                  tint="#FFFFFF"
                  background={accentHex}
                  accessibilityLabel={t("social.approve")}
                  disabled={disabled}
                  onPress={onApprove}
                />
                <CircleActionButton
                  icon="xmark"
                  tint={theme.textSecondary}
                  background={theme.backgroundElement}
                  accessibilityLabel={t("social.reject")}
                  disabled={disabled}
                  onPress={onReject}
                />
              </View>
            }
          />
        </View>
      </RNHostView>
      <SwipeActions.Actions edge="trailing" allowsFullSwipe>
        <Button systemImage="checkmark" label={t("social.approve")} onPress={onApprove} />
        <Button
          role="destructive"
          systemImage="xmark"
          label={t("social.reject")}
          onPress={onReject}
        />
      </SwipeActions.Actions>
    </SwipeActions>
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
  },
  circle: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
