import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenToolbar } from "@/components/navigation";
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
      <ScreenToolbar
        placement="left"
        actions={[
          {
            key: "close",
            icon: "xmark",
            onPress: onClose,
            disabled: closeDisabled,
          },
        ]}
      />
      <ScreenToolbar
        placement="right"
        actions={[
          {
            key: "save",
            icon: "checkmark",
            onPress: onSave ?? (() => {}),
            disabled: saveDisabled,
          },
        ]}
      />

      <KeyboardAwareScrollView
        style={[styles.root, { backgroundColor: theme.background }]}
        bottomOffset={LAYOUT.SCREEN_PADDING}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, LAYOUT.SCREEN_PADDING),
        }}>
        {children}
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
