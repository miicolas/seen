import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useLinkedAccounts } from "@/hooks/account/use-linked-accounts";
import { useTheme } from "@/hooks/use-theme";
import { hapticError, hapticSuccess } from "@/lib/haptics";

import { SettingsRow } from "./settings-row";


export function LinkedAccountsSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accounts, canUnlink, isLoading, error, unlink, isMutating } =
    useLinkedAccounts();

  const onUnlink = useCallback(
    async (providerId: string) => {
      try {
        await unlink(providerId);
        hapticSuccess();
      } catch {
        hapticError();
        Alert.alert(t("account.linkedSection"), t("account.unlinkError"));
      }
    },
    [t, unlink],
  );

  return (
    <Section title={t("account.linkedSection")}>
      {isLoading && accounts.length === 0 ? (
        <View style={{ paddingVertical: SPACING.MD }}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <Text size="sm" color={theme.error} fillWidth>
          {error}
        </Text>
      ) : (
        accounts.map((account) => (
          <SettingsRow
            key={account.id}
            label={
              account.provider_id === "apple"
                ? t("account.providerApple")
                : account.provider_id === "credential"
                  ? t("account.providerCredential")
                  : account.provider_id
            }
            subtitle={canUnlink ? null : t("account.onlyAccount")}
            trailing={
              canUnlink ? (
                <Button
                  title={t("account.unlink")}
                  onPress={() => onUnlink(account.provider_id)}
                  variant="glass"
                  color="red"
                  size="sm"
                  disabled={isMutating}
                />
              ) : undefined
            }
          />
        ))
      )}
    </Section>
  );
}
