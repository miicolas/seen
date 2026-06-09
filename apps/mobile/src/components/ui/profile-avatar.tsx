import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
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
// Reusable across the profile screen and every social profile card. Pass
// `locked` to overlay a lock badge (private profiles).
export function ProfileAvatar({
  uri,
  name,
  size,
  locked = false,
}: {
  uri: string | null;
  name: string | undefined;
  size: number;
  locked?: boolean;
}) {
  const theme = useTheme();
  const { accentHex } = useAccentColor();
  const circle = { width: size, height: size, borderRadius: size / 2 };

  const avatar = uri ? (
    <Image source={{ uri }} contentFit="cover" style={[styles.circle, circle]} />
  ) : (
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

  if (!locked) return avatar;

  const badgeSize = Math.max(20, Math.round(size * 0.26));

  return (
    <View>
      {avatar}
      <View
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: theme.background,
            borderColor: theme.background,
          },
        ]}>
        <SymbolView
          name="lock.fill"
          size={Math.round(badgeSize * 0.52)}
          tintColor={theme.textSecondary}
        />
      </View>
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
  badge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
});
