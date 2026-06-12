import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  type ShareCardFormat,
  shareCardExportSize,
} from "@/components/insights/share/share-card-frame";
import { GlassButton } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { SPACING } from "@/constants/design-tokens";
import { useAnalyticsShareRecap } from "@/hooks/analytics/use-analytics-share-recap";
import { useTheme } from "@/hooks/use-theme";
import { hapticError, hapticSelection, hapticSuccess, hapticTap } from "@/lib/haptics";
import type { ShareRecap, ShareTemplate } from "@/services/analytics";
import { shareCardSnapshot } from "@/services/share";

import { PageDots } from "./page-dots";
import { TemplateCarousel } from "./template-carousel";

type ShareSheetParams = { template?: ShareTemplate };

const TEMPLATES: ShareTemplate[] = ["weekly", "stats", "taste", "watchlist"];

export function ShareRecapSheet() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<ShareSheetParams>();
  const initialTemplate: ShareTemplate =
    params.template && TEMPLATES.includes(params.template) ? params.template : "weekly";

  const [activeTemplate, setActiveTemplate] = useState<ShareTemplate>(initialTemplate);
  const [format, setFormat] = useState<ShareCardFormat>("story");
  const [isSharing, setIsSharing] = useState(false);
  const cardRefs = useRef<Partial<Record<ShareTemplate, View | null>>>({});

  // Hosted RN content goes stale on in-place updates, so every recap must be
  // loaded before the carousel mounts — one render with final content.
  const weekly = useAnalyticsShareRecap("weekly");
  const stats = useAnalyticsShareRecap("stats");
  const taste = useAnalyticsShareRecap("taste");
  const watchlist = useAnalyticsShareRecap("watchlist");
  const recaps: Record<ShareTemplate, ShareRecap> | null =
    weekly.data && stats.data && taste.data && watchlist.data
      ? { weekly: weekly.data, stats: stats.data, taste: taste.data, watchlist: watchlist.data }
      : null;

  const formatOptions = useMemo(
    () => [
      { value: "story" as const, label: t("insights.shareFormatStory") },
      { value: "square" as const, label: t("insights.shareFormatSquare") },
    ],
    [t],
  );

  const handleTemplateChange = useCallback((template: ShareTemplate) => {
    setActiveTemplate((current) => {
      if (template !== current) hapticSelection();
      return template;
    });
  }, []);

  const handleFormatChange = useCallback((next: ShareCardFormat) => {
    hapticSelection();
    cardRefs.current = {};
    setFormat(next);
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
        `seen-${activeTemplate}-${format}`,
        shareCardExportSize(format),
      );
      hapticSuccess();
    } catch {
      hapticError();
    } finally {
      setIsSharing(false);
    }
  }, [activeTemplate, format, isSharing]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.formatToggle}>
        <Segmented options={formatOptions} selection={format} onChange={handleFormatChange} />
      </View>
      <View style={styles.preview}>
        {recaps ? (
          <>
            <TemplateCarousel
              templates={TEMPLATES}
              recaps={recaps}
              initialTemplate={initialTemplate}
              format={format}
              onTemplateChange={handleTemplateChange}
              onCardRef={registerCardRef}
            />
            <PageDots count={TEMPLATES.length} activeIndex={TEMPLATES.indexOf(activeTemplate)} />
          </>
        ) : (
          <ActivityIndicator />
        )}
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
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.LG,
  },
  formatToggle: {
    paddingHorizontal: SPACING.LG,
  },
  preview: {
    flex: 1,
    justifyContent: "center",
    gap: SPACING.MD,
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
