import {
  Button,
  Host,
  HStack,
  Image,
  Text as SwiftUIText,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  frame,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { StyleSheet, View } from "react-native";

import { SPACING } from "@/constants/design-tokens";

export function MediaActions({
  hasReview,
  accentHex,
  onRate,
  onShare,
}: {
  hasReview: boolean;
  accentHex: string;
  onRate: () => void;
  onShare: () => void;
}) {
  return (
    <View style={styles.row}>
      <Host matchContents useViewportSizeMeasurement>
        <Button
          modifiers={[
            buttonStyle("glassProminent"),
            controlSize("large"),
            tint(accentHex),
          ]}
          onPress={onRate}>
          <HStack spacing={8} modifiers={[frame({ height: 20 })]}>
            <Image systemName={hasReview ? "checkmark" : "star.fill"} size={16} />
            <SwiftUIText>{hasReview ? "Rated" : "Mark as seen"}</SwiftUIText>
          </HStack>
        </Button>
      </Host>

      <Host matchContents useViewportSizeMeasurement>
        <Button
          modifiers={[buttonStyle("glass"), controlSize("large")]}
          onPress={onShare}>
          <HStack spacing={8} modifiers={[frame({ height: 20 })]}>
            <Image systemName="square.and.arrow.up" size={16} />
            <SwiftUIText>Share</SwiftUIText>
          </HStack>
        </Button>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SPACING.SM,
    paddingTop: SPACING.SM,
  },
});
