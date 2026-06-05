import { HStack, Image, Text, VStack } from "@expo/ui/swift-ui";
import { font, foregroundStyle, lineLimit, padding } from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity, type LiveActivityEnvironment } from "expo-widgets";
import type { SFSymbol } from "sf-symbols-typescript";

export type ReviewStatusAction = "save" | "delete";
export type ReviewStatusState = "pending" | "success" | "error";

export type ReviewStatusActivityProps = {
  action: ReviewStatusAction;
  state: ReviewStatusState;
};

function ReviewStatusActivity(
  props: ReviewStatusActivityProps,
  _environment: LiveActivityEnvironment,
) {
  "widget";

  const isDelete = props.action === "delete";
  const isPending = props.state === "pending";
  const isError = props.state === "error";
  const accentColor = isPending ? "#0A84FF" : isError ? "#FF453A" : "#63D66F";
  const iconName = (
    isPending ? "arrow.triangle.2.circlepath" : isError ? "xmark" : "checkmark"
  ) as SFSymbol;
  const shortText = isPending ? "..." : isError ? "Erreur" : "OK";
  const title = isDelete ? "Critique" : "Critique";
  const subtitle = isPending
    ? isDelete
      ? "Suppression..."
      : "Enregistrement..."
    : isError
      ? isDelete
        ? "Échec de la suppression"
        : "Échec de l'enregistrement"
      : isDelete
        ? "Critique supprimée"
        : "Critique enregistrée";

  return {
    banner: (
      <VStack spacing={6} modifiers={[padding({ horizontal: 18, vertical: 14 })]}>
        <HStack spacing={10} alignment="center">
          <Image systemName={iconName} color={accentColor} size={28} />
          <Text
            modifiers={[
              foregroundStyle("#FFFFFF"),
              font({ size: 20, weight: "bold", design: "rounded" }),
              lineLimit(1),
            ]}>
            {subtitle}
          </Text>
        </HStack>
        <Text modifiers={[foregroundStyle("#8E8E93"), font({ size: 12 }), lineLimit(1)]}>Seen</Text>
      </VStack>
    ),
    compactLeading: <Image systemName={iconName} color={accentColor} size={16} />,
    compactTrailing: (
      <Text
        modifiers={[
          foregroundStyle(accentColor),
          font({ size: 12, weight: "semibold", design: "rounded" }),
          lineLimit(1),
        ]}>
        {shortText}
      </Text>
    ),
    minimal: <Image systemName={iconName} color={accentColor} size={16} />,
    expandedLeading: (
      <VStack spacing={4} alignment="center" modifiers={[padding({ all: 12 })]}>
        <Image systemName={iconName} color={accentColor} size={28} />
        <Text modifiers={[foregroundStyle("#8E8E93"), font({ size: 11 }), lineLimit(1)]}>Seen</Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack spacing={3} alignment="trailing" modifiers={[padding({ all: 12 })]}>
        <Text
          modifiers={[
            foregroundStyle("#FFFFFF"),
            font({ size: 17, weight: "bold", design: "rounded" }),
            lineLimit(1),
          ]}>
          {title}
        </Text>
        <Text modifiers={[foregroundStyle(accentColor), font({ size: 12 }), lineLimit(1)]}>
          {shortText}
        </Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack spacing={6} modifiers={[padding({ horizontal: 14, bottom: 12 })]}>
        <Text
          modifiers={[
            foregroundStyle("#FFFFFF"),
            font({ size: 16, weight: "semibold", design: "rounded" }),
            lineLimit(1),
          ]}>
          {subtitle}
        </Text>
      </VStack>
    ),
  };
}

export default createLiveActivity<ReviewStatusActivityProps>(
  "ReviewStatusActivity",
  ReviewStatusActivity,
);
