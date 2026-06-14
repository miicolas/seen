import type { StyleProp, ViewStyle } from "react-native";

import { createInsightsChart } from "./create-insights-chart";

export type InsightsRingProps = {
  progress: number;
  colors: string[];
  trackColor?: string;
  lineWidth?: number;
  animate?: boolean;
  style: StyleProp<ViewStyle>;
};

export const InsightsRing =
  createInsightsChart<Omit<InsightsRingProps, "style">>("InsightsRingView");
