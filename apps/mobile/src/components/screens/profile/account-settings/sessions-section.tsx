import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useSessions } from "@/hooks/account/use-sessions";
import { useTheme } from "@/hooks/use-theme";
import { hapticError, hapticSuccess } from "@/lib/haptics";

import { SettingsRow } from "./settings-row";

function deviceLabel(userAgent: string | null, fallback: string) {
  if (!userAgent) return fallback;
  return userAgent.slice(0, 40);
}

export function SessionsSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { sessions, isLoading, error, revoke, revokeOthers, isMutating } =
    useSessions();

  const onRevoke = useCallback(
    async (token: string) => {
      try {
        await revoke(token);
        hapticSuccess();
      } catch {
        hapticError();
        Alert.alert(t("account.sessionsSection"), t("account.revokeError"));
      }
    },
    [revoke, t],
  );

  const onRevokeOthers = useCallback(async () => {
    try {
      await revokeOthers();
      hapticSuccess();
    } catch {
      hapticError();
      Alert.alert(t("account.sessionsSection"), t("account.revokeError"));
    }
  }, [revokeOthers, t]);

  const hasOthers = sessions.some((session) => !session.isCurrent);

  return (
    <Section title={t("account.sessionsSection")}>
      {isLoading && sessions.length === 0 ? (
        <View style={{ paddingVertical: SPACING.MD }}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <Text size="sm" color={theme.error} fillWidth>
          {error}
        </Text>
      ) : (
        <>
          {sessions.map((session) => (
            <SettingsRow
              key={session.id}
              label={
                session.isCurrent
                  ? t("account.thisDevice")
                  : deviceLabel(session.user_agent, t("account.unknownDevice"))
              }
              subtitle={new Date(session.created_at).toLocaleDateString()}
              trailing={
                session.isCurrent ? undefined : (
                  <Button
                    title={t("account.revoke")}
                    onPress={() => onRevoke(session.token)}
                    variant="glass"
                    color="red"
                    size="sm"
                    disabled={isMutating}
                  />
                )
              }
            />
          ))}
          {hasOthers ? (
            <View style={{ paddingTop: SPACING.SM }}>
              <Button
                title={t("account.revokeOthers")}
                onPress={onRevokeOthers}
                variant="glass"
                color="red"
                size="sm"
                width="fill"
                disabled={isMutating}
              />
            </View>
          ) : null}
        </>
      )}
    </Section>
  );
}
