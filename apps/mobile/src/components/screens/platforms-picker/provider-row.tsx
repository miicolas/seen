import { SymbolView } from "expo-symbols";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { tmdbImageUrl } from "@/lib/tmdb";

const LOGO_SIZE = 40;

interface ProviderRowProps {
  name: string;
  logoPath: string | null;
  selected: boolean;
  onToggle: () => void;
}

// One selectable streaming service: logo, name, and a trailing checkmark when
// picked. Used in the RN platforms picker list.
export function ProviderRow({ name, logoPath, selected, onToggle }: ProviderRowProps) {
  const theme = useTheme();
  const { accentHex } = useAccentColor();
  const uri = tmdbImageUrl(logoPath, "w92");

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={name}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Image
        source={uri ? { uri } : undefined}
        style={[styles.logo, { backgroundColor: theme.backgroundElement }]}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.label}>
        <Text inline size="md" weight="medium" color={theme.text} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <SymbolView
        name={selected ? "checkmark.circle.fill" : "circle"}
        size={22}
        tintColor={selected ? accentHex : theme.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  pressed: {
    opacity: 0.6,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: BORDER_RADIUS.SM,
  },
  label: {
    flex: 1,
  },
});
