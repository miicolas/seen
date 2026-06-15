import "@/lib/i18n";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PressablesConfig } from "pressto";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import { useTheme } from "@/hooks/use-theme";

import { SplashScreenController } from "@/components/splash-screen-controller";
import { WhatsNewGate } from "@/components/whats-new-gate";

import { useAuthContext } from "@/hooks/use-auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePushDeepLinks } from "@/hooks/use-push-deep-links";
import { QueryProvider } from "@/lib/query-client";
import AuthProvider from "@/providers/auth-provider";
import { useOnboardingStore } from "@/store/use-onboarding-store";

function RootNavigator() {
  const { isLoggedIn } = useAuthContext();
  const onboardingCompleted = useOnboardingStore((state) => state.completed);
  const theme = useTheme();
  const { t } = useTranslation();
  usePushDeepLinks(isLoggedIn);

  return (
    <>
      <Stack>
        <Stack.Protected guard={isLoggedIn && onboardingCompleted}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={isLoggedIn && !onboardingCompleted}>
          <Stack.Screen name="(setup)/import" options={{ headerShown: false }} />
          <Stack.Screen name="(setup)/taste" options={{ headerShown: false }} />
          <Stack.Screen name="(setup)/platforms" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="(onboarding)/index" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen
          name="import-letterboxd"
          options={{
            title: t("import.screenTitle"),
            presentation: "formSheet",
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen
          name="review"
          options={{
            title: t("review.screenTitle"),
            presentation: "formSheet",
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen
          name="reviews"
          options={{
            title: t("mediaDetail.allReviews"),
            presentation: "formSheet",
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen
          name="episode-reviews"
          options={{
            title: t("mediaDetail.allReviews"),
            presentation: "formSheet",
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen
          name="watch-invitations"
          options={{
            title: t("watch.inboxTitle"),
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.5, 0.9],
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen
          name="watch-invite"
          options={{
            title: t("watch.inviteTitle"),
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.55, 0.9],
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen
          name="recommend"
          options={{
            title: t("recommend.title"),
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.6, 0.95],
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen
          name="media-recommendations"
          options={{
            title: t("recommend.inboxTitle"),
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.5, 0.9],
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen
          name="now-watching"
          options={{
            headerShown: false,
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [1.0],
            contentStyle: { backgroundColor: "#000000" },
          }}
        />
        <Stack.Screen
          name="share-recap"
          options={{
            headerShown: false,
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [1.0],
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen
          name="whats-new"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            headerShadowVisible: false,
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.9],
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <WhatsNewGate />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <PressablesConfig config={{ minScale: 0.97 }}>
          <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <QueryProvider>
              <AuthProvider>
                <SplashScreenController />
                <RootNavigator />
                <StatusBar style="auto" />
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </PressablesConfig>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
