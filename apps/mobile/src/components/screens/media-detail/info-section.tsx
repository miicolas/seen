import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

import { DetailSection } from "./detail-section";
import type { InfoRowData } from "./types";

export function InfoSection({ rows }: { rows: InfoRowData[] }) {
  if (rows.length === 0) return null;

  return (
    <DetailSection title="Information">
      <View style={styles.infoList}>
        {rows.map((row, index) => (
          <InfoRow
            key={row.label}
            label={row.label}
            value={row.value}
            isLast={index === rows.length - 1}
          />
        ))}
      </View>
    </DetailSection>
  );
}

function InfoRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.infoRow,
        isLast
          ? null
          : {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.backgroundSelected,
            },
      ]}>
      <Text size="sm" weight="regular" color={theme.textSecondary}>
        {label}
      </Text>
      <Text size="sm" weight="medium">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoList: {
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.SM,
    gap: SPACING.MD,
  },
});
