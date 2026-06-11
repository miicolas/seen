import { useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/components/ui/button";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticError, hapticSelection, hapticSuccess, hapticTap } from "@/lib/haptics";
import type { ShareTemplate } from "@/services/analytics";
import { shareCardSnapshot } from "@/services/share";

import { PageDots } from "./page-dots";
import { TemplateCarousel } from "./template-carousel";

type ShareSheetParams = { template?: ShareTemplate };

const TEMPLATES: ShareTemplate[] = ["weekly", "taste", "watchlist"];

export function ShareRecapSheet() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<ShareSheetParams>();
  const initialTemplate: ShareTemplate =
    params.template && TEMPLATES.includes(params.template) ? params.template : "weekly";

  const [activeTemplate, setActiveTemplate] = useState<ShareTemplate>(initialTemplate);
  const [isSharing, setIsSharing] = useState(false);
  const cardRefs = useRef<Partial<Record<ShareTemplate, View | null>>>({});

  const handleTemplateChange = useCallback((template: ShareTemplate) => {
    setActiveTemplate((current) => {
      if (template !== current) hapticSelection();
      return template;
    });
  }, []);

  const registerCardRef = useCallback((template: ShareTemplate, node: View | null) => {
    cardRefs.current[template] = node;
  }, []);

  const handleShare = useCallback(async () => {
    if (isSharing) return;
    hapticTap();
    setIsSharing(true);
    try {
      await shareCardSnapshot(
        { current: cardRefs.current[activeTemplate] ?? null },
        `seen-${activeTemplate}`,
      );
      hapticSuccess();
    } catch {
      hapticError();
    } finally {
      setIsSharing(false);
    }
  }, [activeTemplate, isSharing]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.preview}>
        <TemplateCarousel
          templates={TEMPLATES}
          initialTemplate={initialTemplate}
          onTemplateChange={handleTemplateChange}
          onCardRef={registerCardRef}
        />
        <PageDots count={TEMPLATES.length} activeIndex={TEMPLATES.indexOf(activeTemplate)} />
      </View>
      <View style={styles.footer}>
        <GlassButton
          title={t("insights.shareTitle")}
          onPress={handleShare}
          size="md"
          disabled={isSharing}
        />
        <Text style={[styles.hint, { color: theme.textSecondary }]}>{t("insights.shareSafe")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.LG,
  },
  preview: {
    flex: 1,
    justifyContent: "center",
    gap: SPACING.LG,
  },
  footer: {
    gap: SPACING.SM,
    paddingHorizontal: SPACING.LG,
  },
  hint: {
    fontSize: 13,
    textAlign: "center",
  },
});
