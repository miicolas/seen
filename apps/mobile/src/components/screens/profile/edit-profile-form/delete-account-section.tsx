import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { SPACING } from "@/constants/design-tokens";
import { hapticDelete } from "@/lib/haptics";

// Double-confirmation flow before the irreversible account deletion; `onDelete`
// runs only after the second destructive confirm.
export function DeleteAccountSection({
  isDeleting,
  disabled,
  onDelete,
}: {
  isDeleting: boolean;
  disabled: boolean;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  const confirmDelete = useCallback(() => {
    hapticDelete();
    Alert.alert(t("profile.deleteAccountTitle"), t("profile.deleteAccountMessage"), [
      { text: t("profile.cancel"), style: "cancel" },
      {
        text: t("profile.continueDelete"),
        style: "destructive",
        onPress: () => {
          Alert.alert(
            t("profile.deleteAccountFinalTitle"),
            t("profile.deleteAccountFinalMessage"),
            [
              { text: t("profile.cancel"), style: "cancel" },
              {
                text: t("profile.deleteAccount"),
                style: "destructive",
                onPress: onDelete,
              },
            ],
          );
        },
      },
    ]);
  }, [onDelete, t]);

  return (
    <View style={styles.destructive}>
      <Button
        title={isDeleting ? t("profile.deletingAccount") : t("profile.deleteAccount")}
        onPress={confirmDelete}
        variant="glass"
        color="red"
        size="lg"
        width="fill"
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  destructive: {
    paddingTop: SPACING.XL,
    paddingHorizontal: SPACING.MD,
    alignItems: "center",
  },
});
