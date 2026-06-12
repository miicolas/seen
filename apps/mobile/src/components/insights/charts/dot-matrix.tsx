import { StyleSheet, View } from "react-native";

interface DotMatrixProps {
  percent: number;
  color: string;
  inactiveColor: string;
  columns?: number;
  rows?: number;
  dotSize?: number;
  gap?: number;
}

// Bevel-style percentage grid: a matrix of dots filling bottom-up.
export function DotMatrix({
  percent,
  color,
  inactiveColor,
  columns = 8,
  rows = 6,
  dotSize = 6,
  gap = 4,
}: DotMatrixProps) {
  const total = columns * rows;
  const filled = Math.round(Math.min(Math.max(percent, 0), 1) * total);
  const emptyRowsWorth = total - filled;

  return (
    <View style={[styles.grid, { gap }]} accessibilityElementsHidden>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={[styles.row, { gap }]}>
          {Array.from({ length: columns }, (_, column) => {
            const index = row * columns + column;
            const active = index >= emptyRowsWorth;
            return (
              <View
                key={column}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: active ? color : inactiveColor,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    alignSelf: "flex-start",
  },
  row: {
    flexDirection: "row",
  },
});
