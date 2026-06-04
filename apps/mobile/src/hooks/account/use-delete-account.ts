import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { hapticDelete, hapticError } from "@/lib/haptics";
import { deleteAccount } from "@/services/account";

// Two-step confirmation before deleting the account via the server
// (auth.api.deleteUser). Credential users are prompted for their password;
// Apple/OAuth users rely on a fresh session.
export function useDeleteAccount(options?: { requirePassword?: boolean }) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const run = useCallback(
    async (password?: string) => {
      hapticDelete();
      setIsDeleting(true);
      try {
        await deleteAccount(password ? { password } : undefined);
      } catch {
        hapticError();
        setIsDeleting(false);
        Alert.alert(t("account.deleteAccount"), t("account.deleteError"));
      }
    },
    [t],
  );

  const confirm = useCallback(() => {
    hapticDelete();

    const final = () => {
      if (options?.requirePassword) {
        Alert.prompt(
          t("account.currentPassword"),
          undefined,
          [
            { text: t("account.cancel"), style: "cancel" },
            {
              text: t("account.deleteAccount"),
              style: "destructive",
              onPress: (password?: string) => run(password),
            },
          ],
          "secure-text",
        );
        return;
      }
      run();
    };

    Alert.alert(t("account.deleteTitle"), t("account.deleteMessage"), [
      { text: t("account.cancel"), style: "cancel" },
      {
        text: t("account.deleteContinue"),
        style: "destructive",
        onPress: () => {
          Alert.alert(
            t("account.deleteFinalTitle"),
            t("account.deleteFinalMessage"),
            [
              { text: t("account.cancel"), style: "cancel" },
              {
                text: t("account.deleteAccount"),
                style: "destructive",
                onPress: final,
              },
            ],
          );
        },
      },
    ]);
  }, [options?.requirePassword, run, t]);

  return { confirm, isDeleting };
}
