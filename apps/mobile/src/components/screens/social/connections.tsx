import { ProgressView } from "@expo/ui/swift-ui";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { ContentUnavailable } from "@/components/ui/content-unavailable";
import { useFollowList } from "@/hooks/social/use-follow-list";

import { ProfileList } from "./profile-list";
import { ProfileListRow, profileRowKey } from "./profile-list-row";
import { SocialLoading } from "./social-loading";

// Followers / following list for a profile, parameterized by the `kind` route param.
export function Connections() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ profileId: string; kind: string; title?: string }>();
  const kind = params.kind === "following" ? "following" : "followers";
  const list = useFollowList(params.profileId, kind);

  return (
    <>
      <Stack.Title>
        {params.title ??
          (kind === "followers" ? t("social.followersTitle") : t("social.followingTitle"))}
      </Stack.Title>

      {list.isLoading && list.data.length === 0 ? (
        <SocialLoading />
      ) : list.error && list.data.length === 0 ? (
        <ContentUnavailable
          icon="exclamationmark.triangle"
          title={t("social.noResults")}
          description={list.error}
        />
      ) : list.data.length === 0 ? (
        <ContentUnavailable icon="person.2" title={t("social.noResults")} />
      ) : (
        <ProfileList>
          {list.data.map((card, index) => (
            <ProfileListRow
              key={profileRowKey(card)}
              card={card}
              onReveal={index === list.data.length - 1 ? list.loadMore : undefined}
            />
          ))}
          {list.isFetchingNextPage ? <ProgressView /> : null}
        </ProfileList>
      )}
    </>
  );
}
