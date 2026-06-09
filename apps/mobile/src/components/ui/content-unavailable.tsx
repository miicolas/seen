import { ContentUnavailableView, Host } from "@expo/ui/swift-ui";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

interface ContentUnavailableProps {
  icon: SFSymbol;
  title: string;
  description?: string;
  /** Optional call-to-action rendered below the native view (e.g. a <GlassButton />). */
  action?: ReactNode;
  minHeight?: number;
}

// A native iOS empty state. `ContentUnavailableView` lays out and wraps its text
// natively (unlike an RN text inside a Host, which mis-measures long strings), so
// use this for any "nothing here yet" state. The CTA sits in a full-width RN view
// below it, since the native view has no action slot.
export function ContentUnavailable({
  icon,
  title,
  description,
  action,
  minHeight = 260,
}: ContentUnavailableProps) {
  return (
    <View style={[styles.root, { minHeight }]}>
      <Host matchContents={{ vertical: true }} style={styles.host}>
        <ContentUnavailableView title={title} systemImage={icon} description={description} />
      </Host>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  host: {
    width: "100%",
  },
  action: {
    alignSelf: "stretch",
    width: "100%",
  },
});
