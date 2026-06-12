import { StyleSheet, View } from "react-native";

interface StreakDotsProps {
  days: boolean[];
  color: string;
  inactiveColor: string;
  dotSize?: number;
}

// One dot per day (oldest first), active days tinted — the 30-day strip.
export function StreakDots({ days, color, inactiveColor, dotSize = 9 }: StreakDotsProps) {
  return (
    <View style={styles.strip} accessibilityElementsHidden>
      {days.map((active, index) => (
        <View
          key={index}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: active ? color : inactiveColor,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
});
