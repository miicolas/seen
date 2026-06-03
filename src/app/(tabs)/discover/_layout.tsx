import { Stack } from "expo-router";

export default function DiscoverLayout() {
  return (
    <Stack screenOptions={{ title: "Discover", headerLargeTitle: true }}>
      <Stack.Screen name="index" />
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
    </Stack>
  );
}
