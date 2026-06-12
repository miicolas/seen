import { InsightsLineChart, type InsightsLineChartPoint } from "@/lib/native-charts";

import { shareCardColors, type ShareCardFormat } from "./share-card-frame";

interface CardSparklineProps {
  points: InsightsLineChartPoint[];
  accent: string;
  format: ShareCardFormat;
  storyHeight?: number;
  squareHeight?: number;
  xAxisHidden?: boolean;
}

// The static minutes sparkline used by the share cards: snapshot-safe (no
// animation, no selection) and sized per card format. Renders nothing when
// there is no activity to draw.
export function CardSparkline({
  points,
  accent,
  format,
  storyHeight = 150,
  squareHeight = 84,
  xAxisHidden,
}: CardSparklineProps) {
  if (!points.some((point) => point.value > 0)) return null;

  const story = format === "story";
  return (
    <InsightsLineChart
      points={points}
      accentColor={accent}
      labelColor={shareCardColors.muted}
      yAxisHidden
      xAxisHidden={xAxisHidden}
      animate={false}
      selectionEnabled={false}
      style={{ height: story ? storyHeight : squareHeight, marginVertical: story ? 8 : 4 }}
    />
  );
}
