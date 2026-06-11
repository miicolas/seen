import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ContentUnavailable } from "@/components/ui/content-unavailable";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useSocialProfile } from "@/hooks/social/use-social-profile";
import { useSocialProfileActivity } from "@/hooks/social/use-social-profile-activity";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import { connectionsHref, type ConnectionsKind } from "@/lib/navigation";
import { shareProfile } from "@/services/share";

import { ActivityRow } from "../../profile/activity-row";
import { SocialLoading } from "../social-loading";
import { SocialScrollView } from "../social-scroll-view";
import { ProfileHeader } from "./profile-header";
import { WatchlistStrip } from "./watchlist-strip";

export function SocialProfile() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const profile = useSocialProfile(profileId);
  const data = profile.data;
  const unlocked = !!data && !data.locked;
  const activity = useSocialProfileActivity(profileId, { enabled: unlocked });

  const openConnections = useCallback(
    (kind: ConnectionsKind) => {
      if (!data) return;
      const title = kind === "followers" ? t("social.followersTitle") : t("social.followingTitle");
      router.push(connectionsHref(data.id, kind, title));
    },
    [data, router, t],
  );

  const handleShare = useCallback(() => {
    if (!data) return;
    hapticTap();
    void shareProfile({ profileId: data.id, username: data.username, isMe: data.is_me }).catch(
      () => {},
    );
  }, [data]);

  return (
    <>
      {data ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button icon="square.and.arrow.up" onPress={handleShare}>
            {t("share.profileTitle")}
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      ) : null}

      <SocialScrollView
        contentGap={SPACING.LG}
        contentTopPadding={SPACING.MD}
        onEndReached={activity.loadMore}>
        {profile.isLoading && !data ? (
          <SocialLoading minHeight={360} />
        ) : !data ? (
          <ContentUnavailable
            icon="person.crop.circle.badge.exclamationmark"
            title={t("social.noResults")}
          />
        ) : (
          <>
            <ProfileHeader profile={data} onOpenConnections={openConnections} />

            {profile.error ? (
              <Text size="sm" color={theme.error} fillWidth>
                {profile.error}
              </Text>
            ) : null}

            {data.locked ? (
              <ContentUnavailable
                icon="lock"
                title={t("social.privateProfile")}
                description={t("social.privateProfileHint")}
              />
            ) : (
              <>
                <WatchlistStrip profileId={data.id} />

                <View style={styles.section}>
                  <Text size="2xl" weight="bold" color={theme.text} fillWidth>
                    {t("social.activityTitle")}
                  </Text>
                  {activity.isLoading && activity.data.length === 0 ? (
                    <SocialLoading minHeight={120} />
                  ) : activity.data.length > 0 ? (
                    <View style={styles.activityList}>
                      {activity.data.map((item) => (
                        <ActivityRow key={`${item.kind}:${item.id}`} item={item} />
                      ))}
                    </View>
                  ) : (
                    <Text size="sm" color={theme.textSecondary} fillWidth>
                      {t("social.noActivity")}
                    </Text>
                  )}
                  {activity.isFetchingNextPage ? <SocialLoading minHeight={120} /> : null}
                </View>
              </>
            )}
          </>
        )}
      </SocialScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.MD,
  },
  activityList: {
    gap: SPACING.LG,
  },
});
