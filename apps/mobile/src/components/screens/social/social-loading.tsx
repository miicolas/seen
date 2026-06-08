import { ActivityIndicator, StyleSheet, View } from "react-native";

export function SocialLoading({ minHeight = 200 }: { minHeight?: number }) {
  return (
    <View style={[styles.center, { minHeight }]}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});
