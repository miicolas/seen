import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";

export const SHARE_CARD_WIDTH = 320;
export const SHARE_CARD_HEIGHT = 400;

const CARD_BG = "#0B0B0F";
const CARD_TEXT = "#F4F5F8";
const CARD_MUTED = "#8E93A0";
const CARD_RADIUS = 28;

interface ShareCardFrameProps {
  eyebrow: string;
  accent: string;
  children: ReactNode;
}

// The branded, fixed-size canvas every share template renders into. Always dark
// (a share card reads the same in anyone's feed regardless of app theme), with
// an accent glow washing down from the top, the Seen wordmark and the period
// eyebrow so the image is self-explanatory. Snapshot-safe: gradients only, no
// blur views (UIVisualEffectView captures unreliably with view-shot).
export function ShareCardFrame({ eyebrow, accent, children }: ShareCardFrameProps) {
  return (
    <View style={styles.frame}>
      <LinearGradient
        colors={[`${accent}52`, "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <Text style={styles.wordmark}>Seen</Text>
        <View style={[styles.eyebrowPill, { backgroundColor: `${accent}3D` }]}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </View>
      </View>
      <View style={styles.body}>{children}</View>
      <Text style={styles.footer}>seen.app</Text>
    </View>
  );
}

export const shareCardTextColors = { text: CARD_TEXT, muted: CARD_MUTED };

// Shared type ramp for the card bodies — cards override only the hero size.
export const shareCardTypography = StyleSheet.create({
  label: {
    color: CARD_MUTED,
    fontSize: FONT_SIZE.XS,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  hero: {
    color: CARD_TEXT,
    fontSize: FONT_SIZE.HEADING_XL,
    fontWeight: "800",
    letterSpacing: -1.5,
    fontVariant: ["tabular-nums"],
  },
  line: {
    color: CARD_MUTED,
    fontSize: FONT_SIZE.MD,
    fontWeight: "500",
  },
});

const styles = StyleSheet.create({
  frame: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: CARD_BG,
    borderRadius: CARD_RADIUS,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    padding: SPACING.MD + SPACING.SM,
    justifyContent: "space-between",
    overflow: "hidden",
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
  eyebrowPill: {
    borderRadius: 999,
    borderCurve: "continuous",
    paddingHorizontal: SPACING.SM + SPACING.XS,
    paddingVertical: SPACING.XS + 1,
  },
  eyebrow: {
    color: CARD_TEXT,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
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
