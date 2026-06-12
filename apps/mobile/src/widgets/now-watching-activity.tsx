import { Button, HStack, Image, Spacer, Text, VStack, ZStack } from "@expo/ui/swift-ui";
import {
  background,
  buttonStyle,
  clipShape,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  resizable,
} from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity, type LiveActivityEnvironment } from "expo-widgets";

export type NowWatchingActivityProps = {
  title: string;
  subtitle: string;
  remainingLabel: string;
  isPlaying: boolean;
  posterUri?: string;
};

const NowWatchingActivity = (
  props: NowWatchingActivityProps,
  _environment: LiveActivityEnvironment,
) => {
  "widget";
  // Must live inside the function: the "widget" body is serialized and run in
  // the Live Activity context, which can't see module-scope variables.
  const ACCENT = "#FFFFFF";
  const MUTED = "#A1A1AA";
  const POSTER_BACKGROUND = "#2C2C2E";
  const stateIcon = props.isPlaying ? "play.fill" : "pause.fill";
  const toggleButton = (buttonSize: number, iconSize: number) => (
    <Button
      target="now-watching.toggle-playback"
      modifiers={[buttonStyle("plain"), frame({ width: buttonSize, height: buttonSize })]}>
      <Image systemName={stateIcon} color={ACCENT} size={iconSize} />
    </Button>
  );
  const actionButton = toggleButton(36, 28);
  const compactActionButton = toggleButton(26, 17);
  const poster = (
    <ZStack
      modifiers={[
        frame({ width: 36, height: 48 }),
        background(POSTER_BACKGROUND),
        clipShape("roundedRectangle", 8),
      ]}>
      {props.posterUri ? (
        <Image uiImage={props.posterUri} modifiers={[resizable()]} />
      ) : (
        <Image systemName="play.rectangle.fill" color={MUTED} size={22} />
      )}
    </ZStack>
  );

  return {
    banner: (
      <HStack
        spacing={12}
        alignment="center"
        modifiers={[padding({ horizontal: 18, vertical: 14 })]}>
        {poster}
        <VStack spacing={3} alignment="leading">
          <Text
            modifiers={[
              font({ size: 16, weight: "bold", design: "rounded" }),
              foregroundStyle(ACCENT),
              lineLimit(1),
            ]}>
            {props.title}
          </Text>
          {props.subtitle ? (
            <Text modifiers={[font({ size: 13 }), foregroundStyle(ACCENT), lineLimit(1)]}>
              {props.subtitle}
            </Text>
          ) : null}
          <Text modifiers={[font({ size: 13 }), foregroundStyle(ACCENT), lineLimit(1)]}>
            {props.remainingLabel}
          </Text>
        </VStack>
        <Spacer />
        {actionButton}
      </HStack>
    ),
    compactLeading: compactActionButton,
    compactTrailing: (
      <Text
        modifiers={[
          font({ size: 12, weight: "semibold" }),
          foregroundStyle(ACCENT),
          lineLimit(1),
        ]}>
        {props.remainingLabel}
      </Text>
    ),
    minimal: compactActionButton,
    expandedLeading: (
      <VStack spacing={6} alignment="center" modifiers={[padding({ all: 12 })]}>
        {poster}
        {toggleButton(28, 18)}
      </VStack>
    ),
    expandedCenter: (
      <VStack spacing={4} alignment="leading" modifiers={[padding({ vertical: 12 })]}>
        <Text
          modifiers={[
            font({ size: 17, weight: "bold", design: "rounded" }),
            foregroundStyle(ACCENT),
            lineLimit(1),
          ]}>
          {props.title}
        </Text>
        {props.subtitle ? (
          <Text modifiers={[font({ size: 13 }), foregroundStyle(MUTED), lineLimit(1)]}>
            {props.subtitle}
          </Text>
        ) : null}
      </VStack>
    ),
    expandedBottom: (
      <VStack spacing={4} modifiers={[padding({ horizontal: 14, bottom: 12 })]}>
        <Text
          modifiers={[
            font({ size: 13, weight: "semibold", design: "rounded" }),
            foregroundStyle(ACCENT),
            lineLimit(1),
          ]}>
          {props.remainingLabel}
        </Text>
      </VStack>
    ),
  };
};

export default createLiveActivity("NowWatchingActivity", NowWatchingActivity);
