import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DiscoverContainer } from "@/components/discover/container";
import { BottomTabInset, Spacing } from "@/constants/theme";

export function Discover() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentInset={insets}
      contentInsetAdjustmentBehavior="always">
      <DiscoverContainer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: "100%",
    zIndex: 50,
  },
});
