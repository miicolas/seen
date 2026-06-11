import { HStack, Image, Text, VStack } from "@expo/ui/swift-ui";
import { font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity, type LiveActivityEnvironment } from "expo-widgets";

export type NowWatchingActivityProps = {
  title: string;
  subtitle: string;
  remainingLabel: string;
  isPlaying: boolean;
};

const NowWatchingActivity = (
  props: NowWatchingActivityProps,
  _environment: LiveActivityEnvironment,
) => {
  "widget";
  // Must live inside the function: the "widget" body is serialized and run in
  // the Live Activity context, which can't see module-scope variables.
  const ACCENT = "#FFFFFF";
  const stateIcon = props.isPlaying ? "play.fill" : "pause.fill";

  return {
    banner: (
      <HStack modifiers={[padding({ all: 12 })]}>
        <VStack alignment="leading">
          <Text modifiers={[font({ weight: "bold" }), foregroundStyle(ACCENT)]}>{props.title}</Text>
          {props.subtitle ? <Text modifiers={[font({ size: 13 })]}>{props.subtitle}</Text> : null}
          <Text modifiers={[font({ size: 13 })]}>{props.remainingLabel}</Text>
        </VStack>
        <Image systemName={stateIcon} color={ACCENT} />
      </HStack>
    ),
    compactLeading: <Image systemName={stateIcon} color={ACCENT} />,
    compactTrailing: <Text modifiers={[font({ size: 13 })]}>{props.remainingLabel}</Text>,
    minimal: <Image systemName={stateIcon} color={ACCENT} />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Image systemName={stateIcon} color={ACCENT} />
      </VStack>
    ),
    expandedCenter: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: "bold" })]}>{props.title}</Text>
        {props.subtitle ? <Text modifiers={[font({ size: 13 })]}>{props.subtitle}</Text> : null}
      </VStack>
    ),
    expandedBottom: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ size: 13 })]}>{props.remainingLabel}</Text>
      </VStack>
    ),
  };
};

export default createLiveActivity("NowWatchingActivity", NowWatchingActivity);
