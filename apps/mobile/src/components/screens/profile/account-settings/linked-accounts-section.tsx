import { Label, ProgressView, Section } from "@expo/ui/swift-ui";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import type { useLinkedAccounts } from "@/hooks/account/use-linked-accounts";
import { useTheme } from "@/hooks/use-theme";
import { hapticDelete, hapticError } from "@/lib/haptics";

import { SettingsRow } from "../settings-row";

type LinkedAccounts = ReturnType<typeof useLinkedAccounts>;

function providerLabel(providerId: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (providerId === "apple") return t("account.providerApple");
  if (providerId === "credential") return t("account.providerCredential");
  return providerId;
}

function providerIcon(providerId: string): SFSymbol {
  return providerId === "apple" ? "apple.logo" : "envelope";
}

export function LinkedAccountsSection({ linked }: { linked: LinkedAccounts }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleUnlink = useCallback(
    async (providerId: string) => {
      if (!linked.canUnlink) {
        Alert.alert(t("account.linkedSection"), t("account.onlyAccount"));
        return;
      }
      hapticDelete();
      try {
        await linked.unlink(providerId);
      } catch {
        hapticError();
        Alert.alert(t("account.linkedSection"), t("account.unlinkError"));
      }
    },
    [linked, t],
  );

  return (
    <Section title={t("account.linkedSection")}>
      {linked.isLoading ? (
        <ProgressView />
      ) : linked.accounts.length > 0 ? (
        linked.accounts.map((account) => (
          <SettingsRow
            key={account.id}
            icon={providerIcon(account.provider_id)}
            label={providerLabel(account.provider_id, t)}
            onPress={linked.canUnlink ? () => handleUnlink(account.provider_id) : undefined}
          />
        ))
      ) : (
        <Label
          systemImage="exclamationmark.triangle"
          title={t("account.linkedError")}
          color={theme.textSecondary}
        />
      )}
    </Section>
  );
}
