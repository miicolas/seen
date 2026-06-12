import { SymbolView } from "expo-symbols";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenToolbar } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { ContentUnavailable } from "@/components/ui/content-unavailable";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, LAYOUT, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { useInviteFriend } from "@/hooks/watch-sessions/use-invite-friend";
import { hapticError, hapticSelection, hapticSuccess, hapticTap } from "@/lib/haptics";
import { profileAvatarUrl } from "@/services/profiles";
import type { WatchProfileCard } from "@/services/watch-sessions";

export function WatchInvite() {
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : undefined;
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { accentHex } = useAccentColor();
  const { friends, invite } = useInviteFriend(sessionId, !!sessionId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const selected = useMemo(
    () =>
      new Set(selectedIds.filter((id) => friends.data?.some((friend) => friend.user_id === id))),
    [friends.data, selectedIds],
  );
  const selectedCount = selected.size;
  const candidates = friends.data ?? [];
  const canSend = selectedCount > 0 && !isSending;

  function close() {
    hapticTap();
    router.back();
  }

  function toggleFriend(friendId: string) {
    hapticSelection();
    setSelectedIds((current) =>
      current.includes(friendId)
        ? current.filter((selectedId) => selectedId !== friendId)
        : [...current, friendId],
    );
  }

  async function sendInvites() {
    if (!canSend) return;
    setIsSending(true);
    let shouldReset = true;
    try {
      for (const inviteeId of selected) {
        await invite.mutateAsync(inviteeId);
      }
      shouldReset = false;
      hapticSuccess();
      router.back();
    } catch {
      hapticError();
      Alert.alert(t("watch.inviteError"));
    } finally {
      if (shouldReset) setIsSending(false);
    }
  }

  const renderFriend = ({ item }: { item: WatchProfileCard }) => (
    <FriendRow
      friend={item}
      selected={selected.has(item.user_id)}
      accentHex={accentHex}
      onPress={() => toggleFriend(item.user_id)}
    />
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenToolbar placement="left" actions={[{ key: "close", icon: "xmark", onPress: close }]} />

      {friends.isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator />
        </View>
      ) : candidates.length === 0 ? (
        // Rendered outside the FlatList: a SwiftUI Host inside ListEmptyComponent
        // never gets measured and stays invisible.
        <View style={styles.empty}>
          <ContentUnavailable
            icon="person.2.slash"
            title={t("watch.noInvitableFriendsTitle")}
            description={t("watch.noInvitableFriends")}
            minHeight={260}
          />
        </View>
      ) : (
        <FlatList
          data={candidates}
          keyExtractor={(friend) => friend.user_id}
          renderItem={renderFriend}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.XL }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.background,
            paddingBottom: Math.max(insets.bottom, LAYOUT.SCREEN_PADDING),
          },
        ]}>
        <Button
          title={
            selectedCount > 0
              ? t("watch.sendInvitesCount", { count: selectedCount })
              : t("watch.selectFriends")
          }
          icon="paperplane.fill"
          onPress={sendInvites}
          disabled={!canSend}
          loading={isSending}
          width="fill"
        />
      </View>
    </View>
  );
}

function FriendRow({
  friend,
  selected,
  accentHex,
  onPress,
}: {
  friend: WatchProfileCard;
  selected: boolean;
  accentHex: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const displayName = friend.full_name ?? friend.username ?? "";
  const username = friend.username ? `@${friend.username}` : "";

  return (
    <Pressable
      style={[
        styles.row,
        { backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={displayName}
      onPress={onPress}>
      <ProfileAvatar uri={profileAvatarUrl(friend)} name={displayName} size={44} />
      <View style={styles.rowText}>
        <Text size="md" weight="semibold" color={theme.text} numberOfLines={1} fillWidth>
          {displayName}
        </Text>
        {username ? (
          <Text size="sm" weight="regular" color={theme.textSecondary} numberOfLines={1} fillWidth>
            {username}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.check,
          {
            borderColor: selected ? accentHex : theme.textSecondary,
            backgroundColor: selected ? accentHex : "transparent",
          },
        ]}>
        {selected ? (
          <SymbolView name="checkmark" size={14} type="monochrome" tintColor="#FFFFFF" />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: LAYOUT.CONTENT_MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.LG,
  },
  separator: {
    height: SPACING.SM,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
    padding: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: SPACING.XXS,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.FULL,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
    paddingTop: SPACING.SM,
  },
});
