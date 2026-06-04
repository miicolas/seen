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
  reviewedLabel = "Rated",
  unreviewedLabel = "Mark as seen",
}: {
  hasReview: boolean;
  accentHex: string;
  onRate: () => void;
  reviewedLabel?: string;
  unreviewedLabel?: string;
}) {
  return (
    <View style={styles.actionContainer}>
      <Host matchContents>
        <Button
          modifiers={[
            buttonStyle("glassProminent"),
            controlSize("large"),
            tint(accentHex),
          ]}
          onPress={onRate}>
          <HStack spacing={8} modifiers={[frame({ width: 180, height: 16 })]}>
            <Image systemName={hasReview ? "checkmark" : "star.fill"} size={16} />
            <SwiftUIText>
              {hasReview ? reviewedLabel : unreviewedLabel}
            </SwiftUIText>
          </HStack>
        </Button>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.MD,
    marginTop: SPACING.SM,
  },
});
