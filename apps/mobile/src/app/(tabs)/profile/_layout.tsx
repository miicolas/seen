import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/hooks/use-theme";

export default function ProfileLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        title: t("tabs.profile"),
        headerLargeTitle: true,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="edit"
        options={{
          title: t("profile.editTitle"),
          presentation: "formSheet",
          headerLargeTitle: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: t("account.settingsTitle"),
          presentation: "formSheet",
          headerLargeTitle: false,
          contentStyle: { backgroundColor: theme.backgroundElement },
        }}
      />
      <Stack.Screen
        name="episode"
        options={{
          title: "",
          headerShown: true,
          headerLargeTitle: false,
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "",
          headerShown: true,
          headerLargeTitle: false,
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="image"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "fade",
        }}
      />
    </Stack>
  );
}
