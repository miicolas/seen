import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView, type BlurTint } from "expo-blur";
import { Image, type ImageContentPosition, type ImageProps, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ColorValue, type ImageStyle, type ViewStyle } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type GradientColors = readonly [ColorValue, ColorValue, ColorValue, ColorValue];

export type GradientLocations = readonly [number, number, number, number];

// Stops the scrim transparent across the top half of the artwork, then ramps to
// near-opaque black in the bottom quarter — a crisp dark band behind the title
// instead of dimming the whole image.
export const DARK_SCRIM: GradientColors = ["transparent", "#00000040", "#000000B3", "#000000F2"];

const DEFAULT_LOCATIONS: GradientLocations = [0, 0.25, 0.5, 0.75];

export const BOTTOM_SCRIM_LOCATIONS: GradientLocations = [0, 0.5, 0.78, 1];

export interface LinearGradientImageBlurProps {
  showBlur?: boolean;
  showGradient?: boolean;
  showProgressiveBlur?: boolean;
  showSolidColor?: boolean;
  lightGradientColors?: GradientColors;
  darkGradientColors?: GradientColors;
  imageUrl?: ImageSource | number;
  imageTransition?: ImageProps["transition"];
  imageContentPosition?: ImageContentPosition;
  blurIntensity?: number;
  tintColor?: BlurTint;
  solidColor?: string;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  gradientLocations?: GradientLocations;
}

function GradientView({
  colors,
  locations,
}: {
  colors: GradientColors;
  locations: GradientLocations;
}) {
  return (
    <LinearGradient
      colors={colors as [ColorValue, ColorValue, ColorValue, ColorValue]}
      locations={locations as [number, number, number, number]}
      style={[styles.absolute, styles.sizeFull, styles.gradient]}
    />
  );
}

function ProgressiveBlurView({
  colors,
  locations,
  blurIntensity,
  tintColor,
}: {
  colors: GradientColors;
  locations: GradientLocations;
  blurIntensity: number;
  tintColor: BlurTint;
}) {
  return (
    <MaskedView
      style={[styles.absolute, styles.sizeFull, styles.maskedView]}
      maskElement={<GradientView colors={colors} locations={locations} />}>
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
  imageTransition,
  imageContentPosition = "top",
  blurIntensity = 30,
  tintColor = "default",
  solidColor,
  containerStyle,
  imageStyle,
  gradientLocations = DEFAULT_LOCATIONS,
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
            contentPosition={imageContentPosition}
            transition={imageTransition}
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
          <GradientView colors={selectedColors} locations={gradientLocations} />
        </View>
      ) : null}

      {showBlur ? (
        <View style={[styles.absolute, styles.sizeFull, styles.blurLayer]}>
          <BlurView intensity={blurIntensity} tint={tintColor} style={styles.sizeFull} />
        </View>
      ) : null}

      {showProgressiveBlur ? (
        <ProgressiveBlurView
          colors={selectedColors}
          locations={gradientLocations}
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
