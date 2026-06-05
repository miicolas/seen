import { Stack } from "expo-router";

import { useTheme } from "@/hooks/use-theme";

export default function DiscoverLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        title: "Discover",
        headerLargeTitle: true,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="index" />
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
