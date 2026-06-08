import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/constants/design-tokens";

export const SHARE_CARD_WIDTH = 320;
export const SHARE_CARD_HEIGHT = 400;

const CARD_BG = "#0B0B0F";
const CARD_TEXT = "#FFFFFF";
const CARD_MUTED = "#9BA0A6";

interface ShareCardFrameProps {
  eyebrow: string;
  accent: string;
  children: ReactNode;
}

// The branded, fixed-size canvas every share template renders into. Always dark
// (a share card reads the same in anyone's feed regardless of app theme), with the
// Seen wordmark up top and the period eyebrow so the image is self-explanatory.
export function ShareCardFrame({ eyebrow, accent, children }: ShareCardFrameProps) {
  return (
    <View style={styles.frame}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>Seen</Text>
        <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
      </View>
      <View style={styles.body}>{children}</View>
      <Text style={styles.footer}>seen.app</Text>
    </View>
  );
}

export const shareCardTextColors = { text: CARD_TEXT, muted: CARD_MUTED };

const styles = StyleSheet.create({
  frame: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: CARD_BG,
    borderRadius: BORDER_RADIUS.LG,
    borderCurve: "continuous",
    padding: SPACING.MD + SPACING.XS,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmark: {
    color: CARD_TEXT,
    fontSize: FONT_SIZE.LG,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  eyebrow: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: SPACING.SM,
  },
  footer: {
    color: CARD_MUTED,
    fontSize: FONT_SIZE.XS,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
