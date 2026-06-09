import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { ContentUnavailable } from "@/components/ui/content-unavailable";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useSocialProfile } from "@/hooks/social/use-social-profile";
import { useSocialProfileActivity } from "@/hooks/social/use-social-profile-activity";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection } from "@/lib/haptics";
import { connectionsHref, type ConnectionsKind } from "@/lib/navigation";
import { profileAvatarUrl } from "@/services/profiles";

import { ActivityRow } from "../../profile/activity-row";
import { FollowButton } from "../follow-button";
import { SocialLoading } from "../social-loading";
import { SocialScrollView } from "../social-scroll-view";
import { WatchlistStrip } from "./watchlist-strip";

function CountStat({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.stat}>
      <Text size="xl" weight="bold" color={theme.text}>
        {String(value)}
      </Text>
      <Text size="sm" color={theme.textSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}

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
      hapticSelection();
      const title = kind === "followers" ? t("social.followersTitle") : t("social.followingTitle");
      router.push(connectionsHref(data.id, kind, title));
    },
    [data, router, t],
  );

  return (
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
            <View style={styles.header}>
              <ProfileAvatar
                uri={profileAvatarUrl(data)}
                name={data.full_name}
                size={112}
                locked={data.profile_visibility === "followers"}
              />
              <View style={styles.identity}>
                <Text size="3xl" weight="bold" color={theme.text} align="center" numberOfLines={2}>
                  {data.full_name}
                </Text>
                <Text size="lg" color={theme.textSecondary}>
                  {`@${data.username}`}
                </Text>
                {data.follows_me ? (
                  <Text size="sm" color={theme.textSecondary}>
                    {t("social.followsYou")}
                  </Text>
                ) : null}
              </View>

              <View style={styles.stats}>
                <CountStat
                  value={data.followers_count}
                  label={t("social.followers")}
                  onPress={() => openConnections("followers")}
                />
                <CountStat
                  value={data.following_count}
                  label={t("social.followingTitle")}
                  onPress={() => openConnections("following")}
                />
              </View>

              <FollowButton card={data} />
            </View>

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
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: SPACING.LG,
    gap: SPACING.MD,
  },
  identity: {
    alignItems: "center",
    alignSelf: "stretch",
    gap: SPACING.XXS,
  },
  stats: {
    flexDirection: "row",
    gap: SPACING.XL,
  },
  stat: {
    alignItems: "center",
    gap: SPACING.XXS,
  },
  section: {
    gap: SPACING.MD,
  },
  activityList: {
    gap: SPACING.LG,
  },
});
