import { HStack, Image, Text as SwiftUIText, VStack } from "@expo/ui/swift-ui";
import { font, foregroundColor, frame } from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { resolveAppLanguage } from "@/lib/i18n";
import type { WhatsNewFeature } from "@/services/whats-new";

const ICON_SIZE = 36;
const ICON_COLUMN = 56;

// One announced feature as native SwiftUI content (icon + title + description).
// Must stay SwiftUI — the What's New sheet renders inside a Host.
export function FeatureRow({ feature }: { feature: WhatsNewFeature }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const { accentHex } = useAccentColor();
  const lang = resolveAppLanguage(i18n.language);

  return (
    <HStack spacing={SPACING.MD} alignment="top">
      <Image
        systemName={feature.icon}
        size={ICON_SIZE}
        color={accentHex}
        modifiers={[frame({ width: ICON_COLUMN })]}
      />
      <VStack alignment="leading" spacing={SPACING.XS}>
        <SwiftUIText
          modifiers={[
            font({ size: FONT_SIZE.LG, weight: "bold" }),
            foregroundColor(theme.text),
            frame({ maxWidth: 10000, alignment: "leading" }),
          ]}>
          {feature.title[lang]}
        </SwiftUIText>
        <SwiftUIText
          modifiers={[
            font({ size: FONT_SIZE.MD }),
            foregroundColor(theme.textSecondary),
            frame({ maxWidth: 10000, alignment: "leading" }),
          ]}>
          {feature.description[lang]}
        </SwiftUIText>
      </VStack>
    </HStack>
  );
}
