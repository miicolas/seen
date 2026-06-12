import { Host } from "@expo/ui/swift-ui";
import { requireNativeView } from "expo";
import type { StyleProp, ViewStyle } from "react-native";

// Shared wrapper for the Swift Charts views: every chart needs a Host with the
// same matchContents/ignoreSafeArea configuration, so centralize it here.
export function createInsightsChart<NativeProps extends object>(viewName: string) {
  const NativeView: React.ComponentType<NativeProps> = requireNativeView("SeenUI", viewName);

  return function InsightsChart({
    style,
    ...props
  }: NativeProps & { style: StyleProp<ViewStyle> }) {
    return (
      <Host style={style} matchContents={false} ignoreSafeArea="all">
        <NativeView {...(props as NativeProps)} />
      </Host>
    );
  };
}
