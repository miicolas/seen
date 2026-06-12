import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE } from "@/constants/design-tokens";
import { InsightsRing } from "@/lib/native-charts";
import { useTheme } from "@/hooks/use-theme";

interface RingStatProps {
  progress: number;
  value: string;
  label: string;
  sublabel?: string;
  colors: string[];
  trackColor?: string;
  size?: number;
  animate?: boolean;
}

// A native progress ring with the stat rendered in its center and a caption below.
export function RingStat({
  progress,
  value,
  label,
  sublabel,
  colors,
  trackColor,
  size = 84,
  animate = true,
}: RingStatProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <InsightsRing
          progress={progress}
          colors={colors}
          trackColor={trackColor}
          lineWidth={8}
          animate={animate}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text
            style={[styles.value, { color: theme.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {value}
          </Text>
        </View>
      </View>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      {sublabel ? (
        <Text style={[styles.sublabel, { color: theme.textSecondary }]}>{sublabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  value: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontSize: FONT_SIZE.XS,
    fontWeight: "600",
  },
  sublabel: {
    fontSize: FONT_SIZE.XS,
  },
});
