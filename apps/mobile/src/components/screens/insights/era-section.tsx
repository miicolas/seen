import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";

import { InsightCard } from "@/components/insights/insight-card";
import { FONT_SIZE } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import type { CurrentEra } from "@/services/analytics";

export function EraSection({ era }: { era: CurrentEra }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex } = useAccentColor();

  if (era.decade == null) return null;

  return (
    <InsightCard title={t("insights.eraTitle")}>
      <Text style={[styles.statement, { color: theme.text }]}>
        {t("insights.eraStatement")} <Text style={{ color: accentHex }}>{era.label}</Text>
      </Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>
        {t("insights.eraShare", { percent: Math.round(era.share * 100) })}
      </Text>
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  statement: {
    fontSize: FONT_SIZE.XL,
    fontWeight: "700",
  },
  sub: {
    fontSize: FONT_SIZE.SM,
  },
});
