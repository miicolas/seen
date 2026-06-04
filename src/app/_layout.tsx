import "@/lib/i18n";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import "react-native-reanimated";
import { useTheme } from "@/hooks/use-theme";

import { SplashScreenController } from "@/components/splash-screen-controller";

import { useAuthContext } from "@/hooks/use-auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AuthProvider from "@/providers/auth-provider";

function RootNavigator() {
  const { isLoggedIn } = useAuthContext();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen
          name="(onboarding)/index"
          options={{ headerShown: false }}
        />
      </Stack.Protected>
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
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SplashScreenController />
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
