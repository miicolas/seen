import type { StyleProp, ViewStyle } from "react-native";

import { createInsightsChart } from "./create-insights-chart";

export type InsightsBarSegment = { label: string; value: number; color: string };

export type InsightsBreakdownBarProps = {
  segments: InsightsBarSegment[];
  barHeight?: number;
  spacing?: number;
  animate?: boolean;
  style: StyleProp<ViewStyle>;
};

export const InsightsBreakdownBar = createInsightsChart<Omit<InsightsBreakdownBarProps, "style">>(
  "InsightsBreakdownBarView",
);
