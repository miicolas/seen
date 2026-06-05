import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LAYOUT, SPACING } from "@/constants/design-tokens";
import { useLinkedAccounts } from "@/hooks/account/use-linked-accounts";
import { useTheme } from "@/hooks/use-theme";

import { AccountSection } from "./account-section";
import { DangerSection } from "./danger-section";
import { LinkedAccountsSection } from "./linked-accounts-section";
import { SessionsSection } from "./sessions-section";

export function AccountSettings() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { hasCredential } = useLinkedAccounts();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.background }]}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.XL }}>
      <View style={styles.content}>
        <AccountSection hasCredential={hasCredential} />
        <SessionsSection />
        <LinkedAccountsSection />
        <DangerSection hasCredential={hasCredential} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: LAYOUT.CONTENT_MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
    paddingTop: SPACING.MD,
    gap: SPACING.LG,
  },
});
