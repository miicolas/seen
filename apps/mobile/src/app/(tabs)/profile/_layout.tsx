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
    </Stack>
  );
}
