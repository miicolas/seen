import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinearGradientImageBlur } from "@/components/linear-gradient-image-blur";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { signInWithApple } from "@/lib/apple-auth";
import { isDevAuthBypassEnabled, signInWithDevSeedUser } from "@/lib/dev-auth";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";

import { AuthButtons } from "./auth-buttons";
import { ALWAYS_DARK_COLORS, DARK_GRADIENT } from "@/constants/always-dark";
import { useParallaxTilt } from "./use-parallax-tilt";

export function Onboarding() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [appleAvailable, setAppleAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<"apple" | "dev" | null>(null);

  const { foregroundStyle, backgroundStyle } = useParallaxTilt();
  const buttonWidth = Math.max(160, Math.min(width - 80, 360));
  const isLoading = authLoading !== null;
  const showDevAuthBypass = isDevAuthBypassEnabled();

  useEffect(() => {
    let isMounted = true;

    AppleAuthentication.isAvailableAsync()
      .then((isAvailable) => {
        if (isMounted) {
          setAppleAvailable(isAvailable);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAppleAvailable(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleStart() {
    if (isLoading) {
      return;
    }

    hapticTap();
    setError(null);
    setAuthLoading("apple");

    try {
      const result = await signInWithApple();

      if (result.status === "signed-in") {
        hapticSuccess();
      } else if (result.status === "unavailable") {
        hapticError();
        setAppleAvailable(false);
      }
    } catch (authError) {
      hapticError();
      console.error("Apple sign in failed:", authError);
      setError(t("onboarding.authError"));
    } finally {
      setAuthLoading(null);
    }
  }

  async function handleDevSignIn() {
    if (isLoading) {
      return;
    }

    hapticTap();
    setError(null);
    setAuthLoading("dev");

    try {
      await signInWithDevSeedUser();
      hapticSuccess();
    } catch (authError) {
      hapticError();
      console.error("Dev seed sign in failed:", authError);
      setError(t("onboarding.devAuthError"));
    } finally {
      setAuthLoading(null);
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.background, backgroundStyle]}>
        <LinearGradientImageBlur
          imageUrl={require("@/assets/images/background/cover-seen.png")}
          showGradient
          showProgressiveBlur
          lightGradientColors={DARK_GRADIENT}
          darkGradientColors={DARK_GRADIENT}
        />
      </Animated.View>

      <Animated.View
        style={[styles.content, { paddingBottom: Math.max(insets.bottom, 32) }, foregroundStyle]}>
        <View style={styles.textWrapper}>
          <ThemedText style={styles.title}>{t("onboarding.title")}</ThemedText>
          <ThemedText style={styles.subtitle}>{t("onboarding.subtitle")}</ThemedText>
        </View>

        <View style={styles.buttonArea}>
          <AuthButtons
            buttonWidth={buttonWidth}
            isLoading={isLoading}
            appleAvailable={appleAvailable}
            showDevAuthBypass={showDevAuthBypass}
            error={error}
            onApplePress={handleStart}
            onDevPress={handleDevSignIn}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ALWAYS_DARK_COLORS.surface,
  },
  background: {
    position: "absolute",
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
  },
  content: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: "center",
    paddingHorizontal: Spacing.three,
  },
  textWrapper: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "600",
    textAlign: "center",
    color: ALWAYS_DARK_COLORS.text,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "400",
    textAlign: "center",
    marginTop: Spacing.two,
    color: ALWAYS_DARK_COLORS.textMuted,
  },
  buttonArea: {
    minHeight: 44,
    marginTop: Spacing.four,
    alignItems: "center",
    gap: Spacing.two,
  },
});
