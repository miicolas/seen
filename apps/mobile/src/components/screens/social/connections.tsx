import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ContentUnavailable } from "@/components/ui/content-unavailable";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useFollowList } from "@/hooks/social/use-follow-list";
import { useTheme } from "@/hooks/use-theme";
import { socialProfileHref } from "@/lib/navigation";

import { ProfileCardRow } from "./profile-card-row";
import { SocialLoading } from "./social-loading";
import { SocialScrollView } from "./social-scroll-view";

// Followers / following list for a profile, parameterized by the `kind` route param.
export function Connections() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ profileId: string; kind: string; title?: string }>();
  const kind = params.kind === "following" ? "following" : "followers";
  const list = useFollowList(params.profileId, kind);

  const openProfile = useCallback((id: string) => router.push(socialProfileHref(id)), [router]);

  return (
    <>
      <Stack.Title>
        {params.title ??
          (kind === "followers" ? t("social.followersTitle") : t("social.followingTitle"))}
      </Stack.Title>

      <SocialScrollView onEndReached={list.loadMore}>
        {list.isLoading && list.data.length === 0 ? (
          <SocialLoading />
        ) : list.data.length === 0 ? (
          <ContentUnavailable icon="person.2" title={t("social.noResults")} />
        ) : (
          <View style={styles.list}>
            {list.data.map((card) => (
              <ProfileCardRow key={card.id} card={card} onPress={() => openProfile(card.id)} />
            ))}
          </View>
        )}

        {list.isFetchingNextPage ? <SocialLoading /> : null}

        {list.error ? (
          <Text size="sm" color={theme.error} fillWidth>
            {list.error}
          </Text>
        ) : null}
      </SocialScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: SPACING.MD,
  },
});
