import { StyleSheet, View, type DimensionValue } from "react-native";

interface RatingBarProps {
  // 0..1 share of the track to fill.
  fraction: number;
  color: string;
  trackColor: string;
}

export function RatingBar({ fraction, color, trackColor }: RatingBarProps) {
  const width: DimensionValue = `${Math.max(0, Math.min(1, fraction)) * 100}%`;

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    borderCurve: "continuous",
  },
});
