import type { StyleProp, ViewStyle } from "react-native";

import { createInsightsChart } from "./create-insights-chart";

export type InsightsDonutSegment = { label: string; value: number; color: string };

export type InsightsDonutProps = {
  segments: InsightsDonutSegment[];
  innerRadiusRatio?: number;
  angularInset?: number;
  animate?: boolean;
  style: StyleProp<ViewStyle>;
};

export const InsightsDonut =
  createInsightsChart<Omit<InsightsDonutProps, "style">>("InsightsDonutView");
