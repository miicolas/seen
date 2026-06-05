import { Link, type Href } from "expo-router";
import { PressableScale } from "pressto";
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import {
  BOTTOM_SCRIM_LOCATIONS,
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
      blurIntensity={28}
      gradientLocations={BOTTOM_SCRIM_LOCATIONS}
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
        <PressableScale onPress={onPress ?? (() => hapticTap())} style={containerStyle}>
          <Link.AppleZoom>
            <View style={StyleSheet.absoluteFill}>{scrim}</View>
          </Link.AppleZoom>
          {children}
        </PressableScale>
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
