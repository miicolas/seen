import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActionSheetIOS, Alert, Pressable, StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { useInvitations } from "@/hooks/watch-sessions/use-invitations";
import { hapticSelection, hapticSuccess } from "@/lib/haptics";
import { nowWatchingHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb/images";
import type { WatchInvitation } from "@/services/watch-sessions";

export function WatchInvitations() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { inbox, accept, decline } = useInvitations();
  const invitations = inbox.data ?? [];

  function respond(invitation: WatchInvitation) {
    hapticSelection();
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: t("watch.respondTitle", { title: invitation.session.title }),
        options: [
          t("watch.startFromBeginning"),
          t("watch.joinAtHost"),
          t("watch.decline"),
          t("watch.cancel"),
        ],
        destructiveButtonIndex: 2,
        cancelButtonIndex: 3,
      },
      (index) => {
        if (index === 0 || index === 1) {
          accept.mutate(
            { invitationId: invitation.id, fromBeginning: index === 0 },
            {
              onSuccess: (session) => {
                hapticSuccess();
                router.replace(nowWatchingHref(session.id));
              },
              onError: () => Alert.alert(t("watch.loadError")),
            },
          );
        } else if (index === 2) {
          decline.mutate(invitation.id);
        }
      },
    );
  }

  if (!inbox.isLoading && invitations.length === 0) {
    return (
      <View style={styles.empty}>
        <EmptyState icon="envelope" title={t("watch.inboxEmpty")} />
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {invitations.map((invitation) => (
        <Pressable
          key={invitation.id}
          style={[styles.row, { backgroundColor: theme.backgroundElement }]}
          accessibilityLabel={invitation.session.title}
          onPress={() => respond(invitation)}>
          <Image
            source={{ uri: tmdbImageUrl(invitation.session.poster_path, "w154") }}
            style={styles.poster}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.rowText}>
            <Text size="xs" weight="medium" color={theme.textSecondary} numberOfLines={1} inline>
              {t("watch.invitedBy", {
                name: invitation.inviter.full_name ?? invitation.inviter.username ?? "",
              })}
            </Text>
            <Text size="sm" weight="semibold" numberOfLines={2} inline>
              {invitation.session.title}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: SPACING.MD,
    gap: SPACING.SM,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.LG,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
    padding: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
  },
  poster: {
    width: 44,
    height: 62,
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: "#00000022",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
