import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LetterboxdImportBanner } from "@/components/letterboxd-import-banner";
import { GlassButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { BORDER_RADIUS, LAYOUT, OPACITY, SPACING } from "@/constants/design-tokens";
import { useProfileActivity } from "@/hooks/profiles/use-profile-activity";
import { useMyProfile } from "@/hooks/profiles/use-my-profile";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import { profileAvatarUrl } from "@/services/profiles";

import { ActivityRow } from "./activity-row";
import { ProfileAvatar } from "./profile-avatar";

export function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { accentHex } = useAccentColor();
  const profile = useMyProfile();
  const activity = useProfileActivity();
  const refetchProfile = profile.refetch;
  const refetchActivity = activity.refetch;

  useFocusEffect(
    useCallback(() => {
      refetchProfile();
      refetchActivity();
    }, [refetchActivity, refetchProfile]),
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

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="gearshape" onPress={handleSettings}>
          {t("account.settings")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <ScrollView
        style={[styles.root, { backgroundColor: theme.background }]}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: insets.bottom + BottomTabInset + SPACING.LG,
        }}>
        <View style={styles.content}>
          <LetterboxdImportBanner style={styles.bannerSlot} />

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

                <GlassButton title={t("profile.edit")} onPress={handleEdit} size="sm" />
              </View>

              {profile.error ? (
                <Text size="sm" weight="medium" color={theme.error} fillWidth>
                  {profile.error}
                </Text>
              ) : null}

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
  bannerSlot: {
    marginTop: SPACING.MD,
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
