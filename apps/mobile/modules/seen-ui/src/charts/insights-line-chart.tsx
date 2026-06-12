import { Host } from "@expo/ui/swift-ui";
import { requireNativeView } from "expo";
import type { StyleProp, ViewStyle } from "react-native";

export type InsightsLineChartPoint = { label: string; value: number };
export type InsightsLineChartBand = { lower: number; upper: number };

export type InsightsLineChartProps = {
  points: InsightsLineChartPoint[];
  band?: InsightsLineChartBand[];
  average?: number;
  averageLabel?: string;
  accentColor: string;
  bandColor?: string;
  labelColor?: string;
  xLabelStride?: number;
  yAxisHidden?: boolean;
  xAxisHidden?: boolean;
  animate?: boolean;
  selectionEnabled?: boolean;
  onSelectionChange?: (index: number | null) => void;
  style: StyleProp<ViewStyle>;
};

type NativeProps = Omit<InsightsLineChartProps, "onSelectionChange" | "style"> & {
  onSelectionChange?: (event: { nativeEvent: { index: number } }) => void;
};

const NativeView: React.ComponentType<NativeProps> = requireNativeView(
  "SeenUI",
  "InsightsLineChartView",
);

export function InsightsLineChart({ onSelectionChange, style, ...props }: InsightsLineChartProps) {
  return (
    <Host style={style} matchContents={false} ignoreSafeArea="all">
      <NativeView
        {...props}
        onSelectionChange={
          onSelectionChange
            ? ({ nativeEvent }) =>
                onSelectionChange(nativeEvent.index >= 0 ? nativeEvent.index : null)
            : undefined
        }
      />
    </Host>
  );
}
