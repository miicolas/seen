import { Button, LabeledContent, Section, Text, TextField, VStack } from "@expo/ui/swift-ui";
import { disabled, font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";

import { type ObservableText } from "@/components/ui/input";
import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

interface QuickConnectSectionProps {
  mode: "onboarding" | "settings";
  username: ObservableText;
  isImporting: boolean;
  canImport: boolean;
  onChangeText: (value: string) => void;
  onImport: () => void;
}

// First section. In settings mode its header also carries the screen title + subtitle;
// in onboarding mode the RN hero above the form owns them, so only the section label stays.
export function QuickConnectSection({
  mode,
  username,
  isImporting,
  canImport,
  onChangeText,
  onImport,
}: QuickConnectSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Section
      header={
        <VStack
          alignment="leading"
          spacing={SPACING.XS}
          modifiers={[padding({ bottom: SPACING.SM })]}>
          {mode === "settings" ? (
            <>
              <Text
                modifiers={[
                  font({ size: FONT_SIZE.TITLE, weight: "bold" }),
                  foregroundStyle(theme.text),
                ]}>
                {t("import.title")}
              </Text>
              <Text
                modifiers={[font({ size: FONT_SIZE.MD }), foregroundStyle(theme.textSecondary)]}>
                {t("import.subtitle")}
              </Text>
            </>
          ) : null}
          <Text
            modifiers={[
              font({ size: FONT_SIZE.SM, weight: "semibold" }),
              foregroundStyle(theme.textSecondary),
              ...(mode === "settings" ? [padding({ top: SPACING.SM })] : []),
            ]}>
            {t("import.quickTitle")}
          </Text>
        </VStack>
      }
      footer={<Text>{t("import.quickHint")}</Text>}>
      <LabeledContent label={t("import.usernameLabel")}>
        <TextField
          placeholder={t("import.usernamePlaceholder")}
          text={username}
          onTextChange={onChangeText}
          modifiers={[foregroundStyle(theme.text)]}
        />
      </LabeledContent>
      <Button
        label={isImporting ? t("import.importing") : t("import.quickAction")}
        onPress={onImport}
        modifiers={[disabled(isImporting || !canImport)]}
      />
    </Section>
  );
}
