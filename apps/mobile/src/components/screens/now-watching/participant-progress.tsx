import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useTickingPosition } from "@/hooks/watch-sessions/use-ticking-position";
import { formatPlayerTime } from "@/lib/watch-session-position";
import type { WatchParticipant } from "@/services/watch-sessions";

const LABEL_TINT = "rgba(255,255,255,0.65)";

export function ParticipantProgress({
  participant,
  tint,
}: {
  participant: WatchParticipant;
  tint: string;
}) {
  const { t } = useTranslation();
  const position = useTickingPosition(participant);
  const fraction = participant.duration_seconds > 0 ? position / participant.duration_seconds : 0;

  const statusLabel =
    participant.status === "completed"
      ? t("watch.participantFinished")
      : participant.status === "paused"
        ? t("watch.participantPaused")
        : formatPlayerTime(position);

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text size="xs" weight="semibold" color="#FFFFFF" numberOfLines={1} inline>
          {participant.full_name ?? participant.username ?? ""}
        </Text>
        <Text size="xs" weight="medium" color={LABEL_TINT} inline>
          {statusLabel}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(fraction * 100, 100)}%`, backgroundColor: tint },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    gap: SPACING.XS,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  track: {
    height: 4,
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: BORDER_RADIUS.FULL,
  },
});
