import { Stack, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { ContentUnavailable } from "@/components/ui/content-unavailable";
import { useFollowRequests } from "@/hooks/social/use-follow-requests";
import { hapticTap } from "@/lib/haptics";
import { socialProfileHref } from "@/lib/navigation";

import { ProfileList } from "../profile-list";
import { SocialLoading } from "../social-loading";
import { RequestRow } from "./request-row";

export function FollowRequests() {
  const { t } = useTranslation();
  const router = useRouter();
  const requests = useFollowRequests();

  const openProfile = useCallback((id: string) => router.push(socialProfileHref(id)), [router]);

  const approveAll = useCallback(() => {
    hapticTap();
    void requests.approveAll();
  }, [requests]);

  return (
    <>
      {requests.data.length > 0 ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button icon="checkmark.circle" onPress={approveAll}>
            {t("social.approveAll")}
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      ) : null}

      {requests.isLoading ? (
        <SocialLoading minHeight={300} />
      ) : requests.error ? (
        <ContentUnavailable
          icon="exclamationmark.triangle"
          title={t("social.requestsTitle")}
          description={requests.error}
        />
      ) : requests.data.length === 0 ? (
        <ContentUnavailable
          icon="person.crop.circle.badge.checkmark"
          title={t("social.noRequests")}
        />
      ) : (
        <ProfileList>
          {requests.data.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              disabled={requests.isApprovingAll}
              onApprove={() => void requests.approve(request.id)}
              onReject={() => void requests.reject(request.id)}
              onOpen={() => openProfile(request.requester.id)}
            />
          ))}
        </ProfileList>
      )}
    </>
  );
}
