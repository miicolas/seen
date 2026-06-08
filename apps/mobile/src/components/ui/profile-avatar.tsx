import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";

function initials(name: string | undefined) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "S"
  );
}

// A circular avatar that falls back to the user's initials on an accent tint.
// Reusable across the profile screen and every social profile card.
export function ProfileAvatar({
  uri,
  name,
  size,
}: {
  uri: string | null;
  name: string | undefined;
  size: number;
}) {
  const theme = useTheme();
  const { accentHex } = useAccentColor();
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} contentFit="cover" style={[styles.circle, circle]} />;
  }

  return (
    <View
      style={[
        styles.circle,
        styles.fallback,
        circle,
        { backgroundColor: theme.backgroundElement },
      ]}>
      <Text size={size > 80 ? "2xl" : "md"} weight="heavy" color={accentHex}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: "hidden",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
