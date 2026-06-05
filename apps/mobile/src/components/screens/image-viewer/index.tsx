import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { PressableScale } from "pressto";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ZoomableImage } from "@/components/ui/zoomable-image";
import { SPACING } from "@/constants/design-tokens";
import { hapticTap } from "@/lib/haptics";

// Full-screen pinch/pan/double-tap image viewer, presented as a modal over the
// detail screens. The `uri` to display comes in as a route param.
export function ImageViewer() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function handleClose() {
    hapticTap();
    router.back();
  }

  return (
    <View style={styles.root}>
      {uri ? <ZoomableImage uri={uri} /> : null}
      <PressableScale
        onPress={handleClose}
        style={StyleSheet.flatten([styles.close, { top: insets.top + SPACING.SM }])}>
        <SymbolView name="xmark" size={18} tintColor="#ffffff" />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  close: {
    position: "absolute",
    left: SPACING.MD,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
});
