import { Form, Host, Section } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import { Stack, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useAccentColor } from "@/hooks/use-accent-color";
import { useDeleteAccount } from "@/hooks/account/use-delete-account";
import { useLinkedAccounts } from "@/hooks/account/use-linked-accounts";
import { useSessions } from "@/hooks/account/use-sessions";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import { signOut } from "@/services/account";

import { AccountRow } from "./account-row";
import { LinkedAccountsSection } from "./linked-accounts-section";
import { SessionsSection } from "./sessions-section";

export function AccountSettingsSheet() {
  const { t } = useTranslation();
  const router = useRouter();
  const { accentHex } = useAccentColor();
  const linked = useLinkedAccounts();
  const sessions = useSessions();
  const deleteAccount = useDeleteAccount({ requirePassword: linked.hasCredential });

  const close = useCallback(() => {
    hapticTap();
    router.back();
  }, [router]);

  const openEditProfile = useCallback(() => {
    hapticTap();
    router.push("/profile/edit");
  }, [router]);

  const openImport = useCallback(() => {
    hapticTap();
    router.push("/import-letterboxd");
  }, [router]);

  const openPlatforms = useCallback(() => {
    hapticTap();
    router.push("/profile/platforms");
  }, [router]);

  const openWhatsNew = useCallback(() => {
    hapticTap();
    router.push("/whats-new");
  }, [router]);

  const handleSignOut = useCallback(async () => {
    hapticTap();
    try {
      await signOut();
      hapticSuccess();
    } catch {
      hapticError();
    }
  }, []);

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="xmark"
          variant="prominent"
          tintColor={accentHex}
          onPress={close}>
          {t("account.close")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <Host style={{ flex: 1 }}>
        <Form modifiers={[tint(accentHex)]}>
          <Section>
            <AccountRow
              icon="person.crop.circle"
              label={t("profile.edit")}
              onPress={openEditProfile}
            />
            <AccountRow
              icon="square.and.arrow.down"
              label={t("import.menuAction")}
              onPress={openImport}
            />
            <AccountRow icon="tv" label={t("platforms.menuAction")} onPress={openPlatforms} />
            <AccountRow icon="sparkles" label={t("whatsNew.title")} onPress={openWhatsNew} />
          </Section>

          <LinkedAccountsSection linked={linked} />

          <SessionsSection sessions={sessions} />

          <Section>
            <AccountRow
              icon="rectangle.portrait.and.arrow.right"
              label={t("account.signOut")}
              onPress={handleSignOut}
            />
          </Section>

          <Section>
            <AccountRow
              icon="trash"
              label={
                deleteAccount.isDeleting ? t("account.deletingAccount") : t("account.deleteAccount")
              }
              onPress={deleteAccount.confirm}
              destructive
            />
          </Section>
        </Form>
      </Host>
    </>
  );
}
