import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";

import {
  DARK_SCRIM,
  LinearGradientImageBlur,
} from "@/components/linear-gradient-image-blur";
import { Card } from "@/components/ui/card";
import { BORDER_RADIUS } from "@/constants/design-tokens";
import { hapticTap } from "@/lib/haptics";

interface ScrimArtworkCardProps {
  imageUrl: string | undefined;
  width: number;
  aspectRatio: number;
  children: ReactNode;
  href?: Href;
  onPress?: () => void;
}

export function ScrimArtworkCard({
  imageUrl,
  width,
  aspectRatio,
  children,
  href,
  onPress,
}: ScrimArtworkCardProps) {
  const scrim = (
    <LinearGradientImageBlur
      imageUrl={imageUrl ? { uri: imageUrl } : undefined}
      showGradient
      showProgressiveBlur
      blurIntensity={20}
      lightGradientColors={DARK_SCRIM}
      darkGradientColors={DARK_SCRIM}
    />
  );

  if (href) {
    const containerStyle: ViewStyle = {
      width,
      height: width * aspectRatio,
      borderRadius: BORDER_RADIUS.LG,
      borderCurve: "continuous",
      overflow: "hidden",
    };
    return (
      <Link href={href} asChild>
        <Pressable onPress={onPress ?? (() => hapticTap())} style={containerStyle}>
          <Link.AppleZoom>
            <View style={StyleSheet.absoluteFill}>{scrim}</View>
          </Link.AppleZoom>
          {children}
        </Pressable>
      </Link>
    );
  }

  return (
    <Card
      variant="plain"
      onPress={onPress ?? (() => hapticTap())}
      style={{ width, height: width * aspectRatio, padding: 0 }}>
      {scrim}
      {children}
    </Card>
  );
}
