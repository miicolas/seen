import { useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ShareCard } from "@/components/insights/share/share-card";
import { Button } from "@/components/ui/button";
import { SPACING } from "@/constants/design-tokens";
import { useAnalyticsShareRecap } from "@/hooks/analytics/use-analytics-share-recap";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import type { ShareTemplate } from "@/services/analytics";
import { shareCardSnapshot } from "@/services/share";

type ShareSheetParams = { template?: ShareTemplate };

const TEMPLATES: ShareTemplate[] = ["weekly", "taste", "watchlist"];

export function ShareRecapSheet() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex } = useAccentColor();
  const params = useLocalSearchParams<ShareSheetParams>();
  const template: ShareTemplate =
    params.template && TEMPLATES.includes(params.template) ? params.template : "weekly";

  const recap = useAnalyticsShareRecap(template);
  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (isSharing) return;
    hapticTap();
    setIsSharing(true);
    try {
      await shareCardSnapshot(cardRef, `seen-${template}`);
      hapticSuccess();
    } catch {
      hapticError();
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, template]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {recap.isLoading || !recap.data ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <View ref={cardRef} collapsable={false} style={styles.cardWrap}>
            <ShareCard recap={recap.data} accent={accentHex} />
          </View>
          <Button
            title={t("insights.shareTitle")}
            onPress={handleShare}
            variant="glass"
            size="md"
            width="fill"
            disabled={isSharing}
          />
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            {t("insights.shareSafe")}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.LG,
    padding: SPACING.LG,
  },
  center: {
    paddingVertical: SPACING.XL,
  },
  cardWrap: {
    alignSelf: "center",
  },
  hint: {
    fontSize: 13,
    textAlign: "center",
  },
});
