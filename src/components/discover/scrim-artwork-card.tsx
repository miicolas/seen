import type { ReactNode } from "react";

import {
  DARK_SCRIM,
  LinearGradientImageBlur,
} from "@/components/linear-gradient-image-blur";
import { Card } from "@/components/ui/card";
import { hapticTap } from "@/lib/haptics";

interface ScrimArtworkCardProps {
  imageUrl: string | undefined;
  width: number;
  aspectRatio: number;
  children: ReactNode;
  onPress?: () => void;
}

export function ScrimArtworkCard({
  imageUrl,
  width,
  aspectRatio,
  children,
  onPress,
}: ScrimArtworkCardProps) {
  return (
    <Card
      variant="plain"
      onPress={onPress ?? (() => hapticTap())}
      style={{ width, height: width * aspectRatio, padding: 0 }}>
      <LinearGradientImageBlur
        imageUrl={imageUrl ? { uri: imageUrl } : undefined}
        showGradient
        showProgressiveBlur
        blurIntensity={20}
        lightGradientColors={DARK_SCRIM}
        darkGradientColors={DARK_SCRIM}
      />
      {children}
    </Card>
  );
}
