import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, GlassButton } from "@/components/ui/button";
import { ContentUnavailable } from "@/components/ui/content-unavailable";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { LAYOUT, OPACITY, SPACING } from "@/constants/design-tokens";
import { useProfileActivity } from "@/hooks/profiles/use-profile-activity";
import { useMyProfile } from "@/hooks/profiles/use-my-profile";
import { useUnreadRecommendations } from "@/hooks/media-recommendations/use-unread-recommendations";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useFollowRequests } from "@/hooks/social/use-follow-requests";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import { findFriendsHref, followRequestsHref, recommendationsInboxHref } from "@/lib/navigation";
import { profileAvatarUrl } from "@/services/profiles";
import { shareProfile } from "@/services/share";

import { ActivityRow } from "./activity-row";
import { FavoritesSection } from "./favorites-section";
import { ConnectionStrip } from "../social/connection-strip";

export function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { accentHex } = useAccentColor();
  const { user } = useAuthContext();
  const profile = useMyProfile();
  const activity = useProfileActivity();
  const requests = useFollowRequests();
  const recommendations = useUnreadRecommendations();
  const refetchProfile = profile.refetch;
  const refetchActivity = activity.refetch;
  const refetchRequests = requests.refetch;
  const refetchRecommendations = recommendations.refetch;

  useFocusEffect(
    useCallback(() => {
      refetchProfile();
      refetchActivity();
      refetchRequests();
      refetchRecommendations();
    }, [refetchActivity, refetchProfile, refetchRequests, refetchRecommendations]),
  );

  const avatarUri = profileAvatarUrl(profile.data);
  const fullName = profile.data?.full_name;
  const username = profile.data?.username;
  const isPrivate = profile.data?.profile_visibility === "followers";
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

  const openRecommendations = useCallback(() => {
    hapticTap();
    router.push(recommendationsInboxHref());
  }, [router]);

  const userId = user?.id;
  const handleShare = useCallback(() => {
    if (!userId || !username) return;
    hapticTap();
    void shareProfile({ profileId: userId, username, isMe: true }).catch(() => {});
  }, [userId, username]);

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
        <Stack.Toolbar.Button
          icon={recommendations.count > 0 ? "bell.badge" : "bell"}
          onPress={openRecommendations}>
          {t("recommend.inboxTitle")}
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button icon="square.and.arrow.up" onPress={handleShare}>
          {t("share.profileTitle")}
        </Stack.Toolbar.Button>
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
                  <ProfileAvatar uri={avatarUri} name={fullName} size={136} locked={isPrivate} />
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

                <View style={styles.actions}>
                  <Button
                    title={t("profile.edit")}
                    onPress={handleEdit}
                    variant="glass"
                    size="md"
                  />
                  {pendingRequests > 0 ? (
                    <Button
                      title={`${t("social.requestsEntry")} (${pendingRequests})`}
                      onPress={openRequests}
                      variant="soft"
                      size="sm"
                    />
                  ) : null}
                </View>
              </View>

              {profile.error ? (
                <Text size="sm" weight="medium" color={theme.error} fillWidth>
                  {profile.error}
                </Text>
              ) : null}

              <FavoritesSection />

              <ConnectionStrip profileId={user?.id} kind="followers" />
              <ConnectionStrip profileId={user?.id} kind="following" />

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
                  <ContentUnavailable
                    icon="star"
                    title={t("profile.emptyActivity")}
                    description={t("profile.emptyActivityHint")}
                    minHeight={200}
                    action={
                      <GlassButton
                        title={t("profile.discover")}
                        onPress={() => router.push("/(tabs)/search")}
                        size="sm"
                      />
                    }
                  />
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
    gap: SPACING.LG,
  },
  loading: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    paddingTop: 32,
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
  actions: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: SPACING.SM,
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
  retry: {
    alignSelf: "flex-start",
    minHeight: 36,
    justifyContent: "center",
  },
});
