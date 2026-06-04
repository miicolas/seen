import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SPACING } from "@/constants/design-tokens";
import { useDeleteAccount } from "@/hooks/account/use-delete-account";
import { authClient } from "@/lib/auth-client";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import { queryClient } from "@/lib/query-client";

export function DangerSection({ hasCredential }: { hasCredential: boolean }) {
  const { t } = useTranslation();
  const { confirm, isDeleting } = useDeleteAccount({
    requirePassword: hasCredential,
  });

  const signOut = useCallback(async () => {
    hapticTap();
    const { error } = await authClient.signOut();
    if (error) {
      hapticError();
      return;
    }
    queryClient.clear();
    hapticSuccess();
  }, []);

  return (
    <Section title={t("account.dangerSection")}>
      <View style={styles.actions}>
        <Button
          title={t("account.signOut")}
          onPress={signOut}
          variant="glass"
          size="lg"
          width="fill"
          disabled={isDeleting}
        />
        <Button
          title={isDeleting ? t("account.deletingAccount") : t("account.deleteAccount")}
          onPress={confirm}
          variant="glass"
          color="red"
          size="lg"
          width="fill"
          disabled={isDeleting}
        />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.SM,
  },
});
