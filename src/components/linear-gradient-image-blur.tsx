import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView, type BlurTint } from "expo-blur";
import { Image, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  StyleSheet,
  View,
  type ColorValue,
  type ImageStyle,
  type ViewStyle,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type GradientColors = readonly [
  ColorValue,
  ColorValue,
  ColorValue,
  ColorValue,
];

export const DARK_SCRIM: GradientColors = [
  "transparent",
  "#00000040",
  "#00000090",
  "#000000E6",
];

export interface LinearGradientImageBlurProps {
  showBlur?: boolean;
  showGradient?: boolean;
  showProgressiveBlur?: boolean;
  showSolidColor?: boolean;
  lightGradientColors?: GradientColors;
  darkGradientColors?: GradientColors;
  imageUrl?: ImageSource | number;
  blurIntensity?: number;
  tintColor?: BlurTint;
  solidColor?: string;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
}

function GradientView({ colors }: { colors: GradientColors }) {
  return (
    <LinearGradient
      colors={colors as [ColorValue, ColorValue, ColorValue, ColorValue]}
      locations={[0, 0.25, 0.5, 0.75]}
      style={[styles.absolute, styles.sizeFull, styles.gradient]}
    />
  );
}

function ProgressiveBlurView({
  colors,
  blurIntensity,
  tintColor,
}: {
  colors: GradientColors;
  blurIntensity: number;
  tintColor: BlurTint;
}) {
  return (
    <MaskedView
      style={[styles.absolute, styles.sizeFull, styles.maskedView]}
      maskElement={<GradientView colors={colors} />}
    >
      <BlurView intensity={blurIntensity} tint={tintColor} style={styles.sizeFull} />
    </MaskedView>
  );
}

export function LinearGradientImageBlur({
  showBlur = false,
  showGradient = false,
  showProgressiveBlur = false,
  showSolidColor = false,
  lightGradientColors = [
    "transparent",
    Colors.light.background + "40",
    Colors.light.background + "80",
    Colors.light.background,
  ],
  darkGradientColors = [
    "transparent",
    Colors.dark.background + "40",
    Colors.dark.background + "80",
    Colors.dark.background,
  ],
  imageUrl,
  blurIntensity = 30,
  tintColor = "default",
  solidColor,
  containerStyle,
  imageStyle,
}: LinearGradientImageBlurProps) {
  const isDarkMode = useColorScheme() === "dark";
  const selectedColors = isDarkMode ? darkGradientColors : lightGradientColors;

  return (
    <View style={[styles.container, styles.sizeFull, containerStyle]}>
      {imageUrl ? (
        <View style={[styles.absolute, styles.sizeFull, styles.imageContainer]}>
          <Image
            source={imageUrl}
            style={[styles.sizeFull, imageStyle]}
            contentFit="cover"
            contentPosition="top"
          />
        </View>
      ) : null}

      {(showSolidColor || solidColor) && solidColor ? (
        <View
          style={[
            styles.absolute,
            styles.sizeFull,
            styles.solidColor,
            { backgroundColor: solidColor },
          ]}
        />
      ) : null}

      {showGradient ? (
        <View style={[styles.absolute, styles.sizeFull, styles.gradientLayer]}>
          <GradientView colors={selectedColors} />
        </View>
      ) : null}

      {showBlur ? (
        <View style={[styles.absolute, styles.sizeFull, styles.blurLayer]}>
          <BlurView
            intensity={blurIntensity}
            tint={tintColor}
            style={styles.sizeFull}
          />
        </View>
      ) : null}

      {showProgressiveBlur ? (
        <ProgressiveBlurView
          colors={selectedColors}
          blurIntensity={blurIntensity}
          tintColor={tintColor}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  sizeFull: {
    width: "100%",
    height: "100%",
  },
  imageContainer: {
    zIndex: 1,
  },
  solidColor: {
    zIndex: 0,
  },
  gradient: {
    flex: 1,
  },
  gradientLayer: {
    zIndex: 2,
  },
  blurLayer: {
    zIndex: 3,
  },
  maskedView: {
    zIndex: 4,
  },
});
