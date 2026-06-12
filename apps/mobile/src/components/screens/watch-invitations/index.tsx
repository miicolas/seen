import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenToolbar } from "@/components/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { useInvitations } from "@/hooks/watch-sessions/use-invitations";
import { hapticSelection, hapticSuccess, hapticTap } from "@/lib/haptics";
import { nowWatchingHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb/images";
import type { WatchInvitation } from "@/services/watch-sessions";

export function WatchInvitations() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { inbox, accept, decline } = useInvitations();
  const invitations = inbox.data ?? [];

  function close() {
    hapticTap();
    router.back();
  }

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

  const renderInvitation = ({ item }: { item: WatchInvitation }) => (
    <Pressable
      style={[styles.row, { backgroundColor: theme.backgroundElement }]}
      accessibilityLabel={item.session.title}
      onPress={() => respond(item)}>
      <Image
        source={{ uri: tmdbImageUrl(item.session.poster_path, "w154") }}
        style={styles.poster}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.rowText}>
        <Text size="xs" weight="medium" color={theme.textSecondary} numberOfLines={1} inline>
          {t("watch.invitedBy", {
            name: item.inviter.full_name ?? item.inviter.username ?? "",
          })}
        </Text>
        <Text size="sm" weight="semibold" numberOfLines={2} inline>
          {item.session.title}
        </Text>
      </View>
    </Pressable>
  );

  const renderEmpty = () => {
    if (inbox.isLoading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <EmptyState icon="envelope" title={t("watch.inboxEmpty")} />
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenToolbar placement="left" actions={[{ key: "close", icon: "xmark", onPress: close }]} />
      <FlatList
        data={invitations}
        keyExtractor={(invitation) => invitation.id}
        renderItem={renderInvitation}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmpty}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + SPACING.LG },
          invitations.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    width: "100%",
    alignSelf: "center",
    padding: SPACING.MD,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: SPACING.SM,
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
