import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { Section } from "@/components/ui/section";
import { useAccountMutations } from "@/hooks/account/use-account-mutations";
import { useAuthContext } from "@/hooks/use-auth-context";
import { hapticError, hapticSuccess } from "@/lib/haptics";

import { SettingsRow } from "./settings-row";

export function AccountSection({ hasCredential }: { hasCredential: boolean }) {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { updateUser, changePassword } = useAccountMutations();

  const editName = useCallback(() => {
    Alert.prompt(
      t("account.changeName"),
      t("account.namePrompt"),
      [
        { text: t("account.cancel"), style: "cancel" },
        {
          text: t("account.save"),
          onPress: async (name?: string) => {
            const trimmed = name?.trim();
            if (!trimmed) return;
            try {
              await updateUser({ name: trimmed });
              hapticSuccess();
            } catch {
              hapticError();
              Alert.alert(t("account.title"), t("account.saveError"));
            }
          },
        },
      ],
      "plain-text",
      user?.name ?? "",
    );
  }, [t, updateUser, user?.name]);

  const editPassword = useCallback(() => {
    Alert.prompt(
      t("account.currentPassword"),
      undefined,
      [
        { text: t("account.cancel"), style: "cancel" },
        {
          text: t("account.save"),
          onPress: (currentPassword?: string) => {
            if (!currentPassword) return;
            Alert.prompt(
              t("account.newPassword"),
              undefined,
              [
                { text: t("account.cancel"), style: "cancel" },
                {
                  text: t("account.save"),
                  onPress: async (newPassword?: string) => {
                    if (!newPassword) return;
                    try {
                      await changePassword({ currentPassword, newPassword });
                      hapticSuccess();
                      Alert.alert(t("account.title"), t("account.saved"));
                    } catch {
                      hapticError();
                      Alert.alert(t("account.title"), t("account.saveError"));
                    }
                  },
                },
              ],
              "secure-text",
            );
          },
        },
      ],
      "secure-text",
    );
  }, [changePassword, t]);

  return (
    <Section title={t("account.accountSection")}>
      <SettingsRow
        label={t("account.name")}
        value={user?.name ?? "—"}
        onPress={editName}
      />
      <SettingsRow label={t("account.email")} value={user?.email ?? "—"} />
      <SettingsRow
        label={t("account.password")}
        value={hasCredential ? "••••••••" : null}
        subtitle={hasCredential ? null : t("account.passwordManaged")}
        onPress={hasCredential ? editPassword : undefined}
      />
    </Section>
  );
}
