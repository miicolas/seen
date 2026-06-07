import { Button, Label, LabeledContent, ProgressView, Section, Text } from "@expo/ui/swift-ui";
import { foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import type { SessionRow, useSessions } from "@/hooks/account/use-sessions";
import { useTheme } from "@/hooks/use-theme";
import { hapticDelete, hapticError } from "@/lib/haptics";

type Sessions = ReturnType<typeof useSessions>;

const MAX_SESSIONS = 4;

function sessionTitle(session: SessionRow, fallback: string) {
  if (session.isCurrent) return fallback;
  if (session.user_agent) return session.user_agent.split(" ").slice(0, 3).join(" ");
  return fallback;
}

export function SessionsSection({ sessions }: { sessions: Sessions }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleRevoke = useCallback(
    async (session: SessionRow) => {
      hapticDelete();
      try {
        await sessions.revoke(session.token);
      } catch {
        hapticError();
        Alert.alert(t("account.sessionsSection"), t("account.revokeError"));
      }
    },
    [sessions, t],
  );

  return (
    <Section title={t("account.sessionsSection")}>
      {sessions.isLoading ? (
        <ProgressView />
      ) : sessions.sessions.length > 0 ? (
        sessions.sessions.slice(0, MAX_SESSIONS).map((session) => (
          <LabeledContent
            key={session.id}
            label={sessionTitle(session, t("account.unknownDevice"))}>
            {session.isCurrent ? (
              <Text modifiers={[foregroundStyle(theme.textSecondary)]}>
                {t("account.thisDevice")}
              </Text>
            ) : (
              <Button
                role="destructive"
                label={t("account.revoke")}
                onPress={() => handleRevoke(session)}
              />
            )}
          </LabeledContent>
        ))
      ) : (
        <Label
          systemImage="iphone.slash"
          title={t("account.noOtherSessions")}
          color={theme.textSecondary}
        />
      )}
    </Section>
  );
}
