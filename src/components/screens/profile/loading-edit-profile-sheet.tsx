import { useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { LAYOUT } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";

import { EditSheetScaffold } from "./edit-sheet-scaffold";

export function LoadingEditProfileSheet({ error }: { error: string | null }) {
  const router = useRouter();
  const theme = useTheme();

  const close = useCallback(() => {
    hapticTap();
    router.back();
  }, [router]);

  return (
    <EditSheetScaffold onClose={close} saveDisabled>
      <View style={styles.loading}>
        {error ? (
          <Text
            size="sm"
            weight="semibold"
            color={theme.error}
            align="center"
            fillWidth
          >
            {error}
          </Text>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    </EditSheetScaffold>
  );
}

const styles = StyleSheet.create({
  loading: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
  },
});
