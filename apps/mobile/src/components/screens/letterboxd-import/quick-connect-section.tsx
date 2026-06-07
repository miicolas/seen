import { Button, LabeledContent, Section, Text, TextField, VStack } from "@expo/ui/swift-ui";
import { disabled, font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";

import { type ObservableText } from "@/components/ui/input";
import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

interface QuickConnectSectionProps {
  username: ObservableText;
  isImporting: boolean;
  canImport: boolean;
  onChangeText: (value: string) => void;
  onImport: () => void;
}

// First section — also carries the screen hero (title + subtitle) in its header so
// it renders natively for both the onboarding (full-screen) and settings (formSheet) modes.
export function QuickConnectSection({
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
          <Text
            modifiers={[
              font({ size: FONT_SIZE.TITLE, weight: "bold" }),
              foregroundStyle(theme.text),
            ]}>
            {t("import.title")}
          </Text>
          <Text modifiers={[font({ size: FONT_SIZE.MD }), foregroundStyle(theme.textSecondary)]}>
            {t("import.subtitle")}
          </Text>
          <Text
            modifiers={[
              font({ size: FONT_SIZE.SM, weight: "semibold" }),
              foregroundStyle(theme.textSecondary),
              padding({ top: SPACING.SM }),
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
