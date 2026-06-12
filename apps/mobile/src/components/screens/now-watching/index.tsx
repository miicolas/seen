import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinearGradientImageBlur } from "@/components/linear-gradient-image-blur";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";

import { ParticipantProgress } from "./participant-progress";
import { Scrubber } from "./scrubber";
import { useNowWatchingViewModel } from "./use-now-watching-view-model";

const SUBTLE_TINT = "rgba(255,255,255,0.65)";

export function NowWatching() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { accentHex } = useAccentColor();
  const vm = useNowWatchingViewModel();
  const pendingInviteLabel =
    vm.pendingInvitees.length === 1
      ? t("watch.inviteSent", {
          name: vm.pendingInvitees[0]?.full_name ?? vm.pendingInvitees[0]?.username ?? "",
        })
      : vm.pendingInvitees.length > 1
        ? t("watch.inviteSentMultiple", { count: vm.pendingInvitees.length })
        : null;

  if (!vm.detail) {
    return (
      <View style={styles.fallback}>
        {vm.error ? (
          <Text size="sm" weight="regular" color={SUBTLE_TINT}>
            {t("watch.loadError")}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradientImageBlur
        showBlur
        showGradient
        imageUrl={vm.posterUri ? { uri: vm.posterUri } : undefined}
        blurIntensity={70}
        tintColor="dark"
        containerStyle={styles.backdrop}
      />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + SPACING.LG, paddingBottom: insets.bottom + SPACING.MD },
        ]}>
        <View style={styles.posterWrap}>
          <Image
            source={vm.posterUri ? { uri: vm.posterUri } : undefined}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
        </View>

        <View style={styles.titleBlock}>
          <Text size="xl" weight="bold" color="#FFFFFF" align="center" numberOfLines={2}>
            {vm.detail.title}
          </Text>
          {vm.subtitle ? (
            <Text size="sm" weight="semibold" color={SUBTLE_TINT} align="center">
              {vm.subtitle}
            </Text>
          ) : null}
          {vm.watchingWith ? (
            <Text size="xs" weight="medium" color={SUBTLE_TINT} align="center">
              {t("watch.watchingWith", { name: vm.watchingWith })}
            </Text>
          ) : pendingInviteLabel ? (
            <Text size="xs" weight="medium" color={SUBTLE_TINT} align="center">
              {pendingInviteLabel}
            </Text>
          ) : null}
        </View>

        <Scrubber position={vm.position} duration={vm.duration} tint="#FFFFFF" onSeek={vm.seekTo} />

        <View style={styles.transport}>
          <TransportButton
            icon="gobackward.30"
            label={t("watch.back30")}
            size={30}
            onPress={() => vm.skip(-1)}
          />
          <TransportButton
            icon={vm.isPlaying ? "pause.fill" : "play.fill"}
            label={vm.isPlaying ? t("watch.pause") : t("watch.play")}
            size={44}
            onPress={vm.togglePlay}
          />
          <TransportButton
            icon="goforward.30"
            label={t("watch.forward30")}
            size={30}
            onPress={() => vm.skip(1)}
          />
        </View>

        {vm.others.length > 0 ? (
          <View style={styles.participants}>
            {vm.others.map((participant) => (
              <ParticipantProgress
                key={participant.user_id}
                participant={participant}
                tint={accentHex}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.footer}>
          {/* flex wrapper: width="fill" alone would span the whole row and push
              the circular buttons off-screen. */}
          <View style={styles.finishButton}>
            <Button
              icon="checkmark"
              title={t("watch.finish")}
              tintColor={accentHex}
              onPress={() => void vm.handleFinish()}
              loading={vm.isFinishing}
              width="fill"
              haptic
            />
          </View>
          {vm.canInvite ? (
            <Pressable
              style={styles.menuButton}
              accessibilityLabel={t("watch.invite")}
              hitSlop={SPACING.SM}
              onPress={vm.openInvite}>
              <SymbolView
                name="person.badge.plus"
                size={20}
                type="monochrome"
                tintColor="#FFFFFF"
              />
            </Pressable>
          ) : null}
          {vm.isHost ? (
            <Pressable
              style={styles.menuButton}
              accessibilityLabel={t("watch.cancelSession")}
              hitSlop={SPACING.SM}
              onPress={vm.openMenu}>
              <SymbolView name="ellipsis" size={20} type="monochrome" tintColor="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function TransportButton({
  icon,
  label,
  size,
  onPress,
}: {
  icon: Parameters<typeof SymbolView>[0]["name"];
  label: string;
  size: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.transportButton}
      accessibilityLabel={label}
      hitSlop={SPACING.SM}
      onPress={onPress}>
      <SymbolView name={icon} size={size} type="monochrome" tintColor="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  // Above the backdrop's internal zIndex layers (image/gradient/blur use 1-4),
  // same fix as the taste-swipe screen — without it the blur paints over the UI.
  content: {
    flex: 1,
    zIndex: 10,
    paddingHorizontal: SPACING.MD * 1.5,
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.MD,
  },
  posterWrap: {
    flexShrink: 1,
    borderRadius: BORDER_RADIUS.MD,
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  poster: {
    width: 230,
    aspectRatio: 2 / 3,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: "#1C1C1E",
  },
  titleBlock: {
    alignItems: "center",
    gap: SPACING.XS,
    width: "100%",
  },
  transport: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.XL,
    width: "100%",
  },
  transportButton: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  participants: {
    width: "100%",
    gap: SPACING.SM,
  },
  footer: {
    width: "100%",
    maxWidth: 320,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
  },
  finishButton: {
    flex: 1,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
});
