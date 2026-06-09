import { Stack, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ContentUnavailable } from "@/components/ui/content-unavailable";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useFollowRequests } from "@/hooks/social/use-follow-requests";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import { socialProfileHref } from "@/lib/navigation";

import { SocialLoading } from "../social-loading";
import { SocialScrollView } from "../social-scroll-view";
import { RequestRow } from "./request-row";

export function FollowRequests() {
  const { t } = useTranslation();
  const theme = useTheme();
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

      <SocialScrollView>
        {requests.isLoading ? (
          <SocialLoading minHeight={300} />
        ) : requests.data.length === 0 ? (
          <ContentUnavailable
            icon="person.crop.circle.badge.checkmark"
            title={t("social.noRequests")}
          />
        ) : (
          <View style={styles.list}>
            {requests.data.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                disabled={requests.isApprovingAll}
                onApprove={() => requests.approve(request.id)}
                onReject={() => requests.reject(request.id)}
                onOpen={() => openProfile(request.requester.id)}
              />
            ))}
          </View>
        )}

        {requests.error ? (
          <Text size="sm" color={theme.error} fillWidth>
            {requests.error}
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
