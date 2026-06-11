import { Image } from "expo-image";
import { PressableScale } from "pressto";
import { StyleSheet } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { tmdbImageUrl } from "@/lib/tmdb";

const LOGO_SIZE = 28;

interface ProviderPillProps {
  name: string;
  logoPath: string | null;
  selected: boolean;
  onToggle: () => void;
}

// One selectable streaming service as an Apple Podcasts-style pill: leading
// logo hugging the edge, name, filled accent when picked. Laid out in a wrap
// cloud by the platforms picker.
export function ProviderPill({ name, logoPath, selected, onToggle }: ProviderPillProps) {
  const theme = useTheme();
  const { accentHex } = useAccentColor();
  const uri = tmdbImageUrl(logoPath, "w92");

  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={name}
      onPress={onToggle}
      style={StyleSheet.flatten([
        styles.pill,
        { backgroundColor: selected ? accentHex : theme.backgroundElement },
      ])}>
      <Image
        source={uri ? { uri } : undefined}
        style={[styles.logo, { backgroundColor: theme.background }]}
        contentFit="cover"
        transition={150}
      />
      <Text
        inline
        size="sm"
        weight="semibold"
        color={selected ? theme.onAccent : theme.text}
        numberOfLines={1}>
        {name}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
    height: 44,
    paddingLeft: SPACING.SM - 2,
    paddingRight: SPACING.MD,
    borderRadius: BORDER_RADIUS.FULL,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: BORDER_RADIUS.FULL,
  },
});
