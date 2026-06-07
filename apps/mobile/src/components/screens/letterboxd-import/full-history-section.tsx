import { Button, Section, Text } from "@expo/ui/swift-ui";
import { disabled } from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";

interface FullHistorySectionProps {
  isImporting: boolean;
  onOpenExport: () => void;
  onUpload: () => void;
}

export function FullHistorySection({
  isImporting,
  onOpenExport,
  onUpload,
}: FullHistorySectionProps) {
  const { t } = useTranslation();

  return (
    <Section title={t("import.fullTitle")} footer={<Text>{t("import.fullHint")}</Text>}>
      <Button
        systemImage="arrow.up.right.square"
        label={t("import.openExport")}
        onPress={onOpenExport}
      />
      <Button
        systemImage="square.and.arrow.up"
        label={isImporting ? t("import.importing") : t("import.uploadAction")}
        onPress={onUpload}
        modifiers={[disabled(isImporting)]}
      />
    </Section>
  );
}
