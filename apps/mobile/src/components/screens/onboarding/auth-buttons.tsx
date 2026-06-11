import * as AppleAuthentication from "expo-apple-authentication";
import { Button as SwiftUIButton, HStack, Host, Text as SwiftUIText } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  font,
  foregroundColor,
  frame,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { ALWAYS_DARK_COLORS } from "@/constants/always-dark";

function GlassButton({
  label,
  width,
  height,
  prominent,
  onPress,
}: {
  label: string;
  width: number;
  height: number;
  prominent?: boolean;
  onPress: () => void;
}) {
  return (
    <Host matchContents>
      <SwiftUIButton
        modifiers={[
          buttonStyle(prominent ? "glassProminent" : "glass"),
          controlSize("mini"),
          tint(ALWAYS_DARK_COLORS.text),
          disabledModifier(prominent ?? false),
        ]}
        onPress={onPress}>
        <HStack modifiers={[frame({ width, height })]}>
          <SwiftUIText
            modifiers={[
              font({ weight: "semibold", size: prominent ? 16 : 15 }),
              foregroundColor(prominent ? ALWAYS_DARK_COLORS.surface : ALWAYS_DARK_COLORS.text),
            ]}>
            {label}
          </SwiftUIText>
        </HStack>
      </SwiftUIButton>
    </Host>
  );
}

export function AuthButtons({
  buttonWidth,
  isLoading,
  appleAvailable,
  showDevAuthBypass,
  error,
  onApplePress,
  onDevPress,
}: {
  buttonWidth: number;
  isLoading: boolean;
  appleAvailable: boolean | null;
  showDevAuthBypass: boolean;
  error: string | null;
  onApplePress: () => void;
  onDevPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      {isLoading ? (
        <GlassButton
          label={t("onboarding.authenticating")}
          width={buttonWidth}
          height={44}
          prominent
          onPress={() => {}}
        />
      ) : appleAvailable === true ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={22}
          onPress={onApplePress}
          style={{ width: buttonWidth, height: 44 }}
        />
      ) : null}

      {showDevAuthBypass && !isLoading ? (
        <GlassButton
          label={t("onboarding.devSignIn")}
          width={buttonWidth}
          height={40}
          onPress={onDevPress}
        />
      ) : null}

      {appleAvailable === false && !showDevAuthBypass ? (
        <ThemedText style={styles.statusText}>{t("onboarding.appleUnavailable")}</ThemedText>
      ) : null}

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
    </>
  );
}

const styles = StyleSheet.create({
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: ALWAYS_DARK_COLORS.textMuted,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: ALWAYS_DARK_COLORS.error,
  },
});
