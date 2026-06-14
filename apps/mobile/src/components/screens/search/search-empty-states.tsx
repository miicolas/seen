import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { GlassButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { hapticTap } from "@/lib/haptics";

export function WarmUpPrompt() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.prompt}>
      <EmptyState
        icon="sparkles"
        title={t("home.empty.title")}
        subtitle={t("home.empty.subtitle")}
        action={
          <View style={styles.promptActions}>
            <GlassButton
              title={t("home.empty.ctaTaste")}
              onPress={() => {
                hapticTap();
                router.push("/(setup)/taste");
              }}
            />
            <GlassButton
              title={t("home.empty.ctaImport")}
              onPress={() => {
                hapticTap();
                router.push("/(setup)/import");
              }}
            />
          </View>
        }
      />
    </View>
  );
}

export function InlineEmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: SFSymbol;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.inlineState}>
      <EmptyState icon={icon} title={title} subtitle={subtitle} />
    </View>
  );
}

export function InlineMessage({ children }: { children: string }) {
  return (
    <View style={styles.inlineState}>
      <Text size="sm" weight="medium" align="center">
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  promptActions: {
    alignSelf: "stretch",
    gap: SPACING.SM,
  },
  inlineState: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.XL,
    alignItems: "center",
    justifyContent: "center",
  },
});
