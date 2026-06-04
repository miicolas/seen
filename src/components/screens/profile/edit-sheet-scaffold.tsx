import { Stack } from "expo-router";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LAYOUT } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

export function EditSheetScaffold({
  onClose,
  onSave,
  closeDisabled = false,
  saveDisabled = false,
  children,
}: {
  onClose: () => void;
  onSave?: () => void;
  closeDisabled?: boolean;
  saveDisabled?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={onClose} disabled={closeDisabled}>
          <Stack.Toolbar.Icon sf="xmark" />
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={onSave} disabled={saveDisabled}>
          <Stack.Toolbar.Icon sf="checkmark" />
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <ScrollView
        style={[styles.root, { backgroundColor: theme.background }]}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, LAYOUT.SCREEN_PADDING),
        }}
      >
        {children}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
