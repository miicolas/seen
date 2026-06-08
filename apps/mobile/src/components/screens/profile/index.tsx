import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, GlassButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { BORDER_RADIUS, LAYOUT, OPACITY, SPACING } from "@/constants/design-tokens";
import { useProfileActivity } from "@/hooks/profiles/use-profile-activity";
import { useMyProfile } from "@/hooks/profiles/use-my-profile";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useFollowRequests } from "@/hooks/social/use-follow-requests";
import { useSocialProfile } from "@/hooks/social/use-social-profile";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection, hapticTap } from "@/lib/haptics";
import {
  connectionsHref,
  findFriendsHref,
  followRequestsHref,
  privacyHref,
  type ConnectionsKind,
} from "@/lib/navigation";
import { profileAvatarUrl } from "@/services/profiles";

import { ActivityRow } from "./activity-row";
import { FavoritesSection } from "./favorites-section";

export function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { accentHex } = useAccentColor();
  const { user } = useAuthContext();
  const profile = useMyProfile();
  const activity = useProfileActivity();
  const social = useSocialProfile(user?.id);
  const requests = useFollowRequests();
  const refetchProfile = profile.refetch;
  const refetchActivity = activity.refetch;
  const refetchSocial = social.refetch;
  const refetchRequests = requests.refetch;

  useFocusEffect(
    useCallback(() => {
      refetchProfile();
      refetchActivity();
      refetchSocial();
      refetchRequests();
    }, [refetchActivity, refetchProfile, refetchSocial, refetchRequests]),
  );

  const avatarUri = profileAvatarUrl(profile.data);
  const fullName = profile.data?.full_name;
  const username = profile.data?.username;
  const isLoading = profile.isLoading && !profile.data;

  const handleEdit = useCallback(() => {
    hapticTap();
    router.push("/profile/edit");
  }, [router]);

  const handleSettings = useCallback(() => {
    hapticTap();
    router.push("/profile/settings");
  }, [router]);

  const openFindFriends = useCallback(() => {
    hapticTap();
    router.push(findFriendsHref());
  }, [router]);

  const openRequests = useCallback(() => {
    hapticTap();
    router.push(followRequestsHref());
  }, [router]);

  const openPrivacy = useCallback(() => {
    hapticTap();
    router.push(privacyHref());
  }, [router]);

  const openConnections = useCallback(
    (kind: ConnectionsKind) => {
      if (!social.data) return;
      hapticSelection();
      const title = kind === "followers" ? t("social.followersTitle") : t("social.followingTitle");
      router.push(connectionsHref(social.data.id, kind, title));
    },
    [router, social.data, t],
  );

  const pendingRequests = requests.data.length;

  const loadMore = activity.loadMore;
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceToBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (distanceToBottom < 400) loadMore();
    },
    [loadMore],
  );

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="person.badge.plus" onPress={openFindFriends}>
          {t("social.findFriends")}
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button icon="gearshape" onPress={handleSettings}>
          {t("account.settings")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <ScrollView
        style={[styles.root, { backgroundColor: theme.background }]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom: insets.bottom + BottomTabInset + SPACING.LG,
        }}>
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={[styles.avatarShadow, { shadowColor: theme.text }]}>
                  <ProfileAvatar uri={avatarUri} name={fullName} size={136} />
                </View>

                <View style={styles.identity}>
                  <Text size="5xl" color={theme.text} align="center" fillWidth numberOfLines={2}>
                    {fullName ?? t("profile.untitled")}
                  </Text>
                  {username ? (
                    <Text size="xl" color={theme.textSecondary}>
                      {`@${username}`}
                    </Text>
                  ) : null}
                </View>

                {social.data ? (
                  <View style={styles.stats}>
                    <Pressable style={styles.stat} onPress={() => openConnections("followers")}>
                      <Text size="xl" weight="bold" color={theme.text}>
                        {String(social.data.followers_count)}
                      </Text>
                      <Text size="sm" color={theme.textSecondary}>
                        {t("social.followers")}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.stat} onPress={() => openConnections("following")}>
                      <Text size="xl" weight="bold" color={theme.text}>
                        {String(social.data.following_count)}
                      </Text>
                      <Text size="sm" color={theme.textSecondary}>
                        {t("social.followingTitle")}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                <View style={styles.actions}>
                  <GlassButton title={t("profile.edit")} onPress={handleEdit} size="sm" />
                  <View style={styles.actionsRow}>
                    <View style={styles.action}>
                      <Button
                        title={
                          pendingRequests > 0
                            ? `${t("social.requestsEntry")} (${pendingRequests})`
                            : t("social.requestsEntry")
                        }
                        onPress={openRequests}
                        variant="soft"
                        size="sm"
                        width="fill"
                      />
                    </View>
                    <View style={styles.action}>
                      <Button
                        title={t("privacy.entry")}
                        onPress={openPrivacy}
                        variant="soft"
                        size="sm"
                        width="fill"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {profile.error ? (
                <Text size="sm" weight="medium" color={theme.error} fillWidth>
                  {profile.error}
                </Text>
              ) : null}

              <FavoritesSection />

              <View style={styles.section}>
                <Text size="2xl" weight="bold" color={theme.text} fillWidth>
                  {t("profile.activityTitle")}
                </Text>

                {activity.isLoading && activity.data.length === 0 ? (
                  <View style={styles.activityLoading}>
                    <ActivityIndicator />
                  </View>
                ) : activity.data.length > 0 ? (
                  <View style={styles.activityList}>
                    {activity.data.map((item) => (
                      <ActivityRow key={`${item.kind}:${item.id}`} item={item} />
                    ))}
                  </View>
                ) : (
                  <View style={[styles.emptyState, { backgroundColor: theme.backgroundElement }]}>
                    <EmptyState
                      icon="star"
                      title={t("profile.emptyActivity")}
                      subtitle={t("profile.emptyActivityHint")}
                      action={
                        <GlassButton
                          title={t("profile.discover")}
                          onPress={() => router.push("/(tabs)/discover")}
                          size="sm"
                        />
                      }
                    />
                  </View>
                )}

                {activity.isFetchingNextPage ? (
                  <View style={styles.activityLoading}>
                    <ActivityIndicator />
                  </View>
                ) : null}

                {activity.error ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => activity.refetch()}
                    style={({ pressed }) => [
                      styles.retry,
                      { opacity: pressed ? OPACITY.DISABLED : 1 },
                    ]}>
                    <Text size="sm" weight="bold" color={accentHex}>
                      {t("profile.retry")}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </>
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
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
  },
  loading: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 40,
    gap: SPACING.MD,
  },
  avatarShadow: {
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
  },
  identity: {
    alignItems: "center",
    alignSelf: "stretch",
    gap: 2,
  },
  stats: {
    flexDirection: "row",
    gap: SPACING.XL,
  },
  stat: {
    alignItems: "center",
    gap: SPACING.XXS,
  },
  actions: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: SPACING.SM,
  },
  actionsRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: SPACING.SM,
  },
  action: {
    flex: 1,
  },
  section: {
    gap: SPACING.MD,
  },
  activityList: {
    gap: SPACING.LG,
  },
  activityLoading: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    minHeight: 150,
    borderRadius: BORDER_RADIUS.MD,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.SM,
    padding: SPACING.LG,
  },
  retry: {
    alignSelf: "flex-start",
    minHeight: 36,
    justifyContent: "center",
  },
});
