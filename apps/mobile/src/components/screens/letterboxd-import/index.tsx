import { Button, Form, Host, Label, Section, useNativeState } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { useLetterboxdImport } from "@/hooks/import/use-letterboxd-import";
import { hapticTap } from "@/lib/haptics";
import type { ImportSummary, TmdbCandidate, UnmatchedRow } from "@/services/import";
import { useOnboardingStore } from "@/store/use-onboarding-store";

import { FullHistorySection } from "./full-history-section";
import { QuickConnectSection } from "./quick-connect-section";
import { UnmatchedSection } from "./unmatched-section";

const EXPORT_URL = "https://letterboxd.com/user/exportdata/";

interface LetterboxdImportProps {
  mode: "onboarding" | "settings";
}

function mergeSummary(prev: ImportSummary | null, next: ImportSummary): ImportSummary {
  if (!prev) return next;
  return {
    imported: prev.imported + next.imported,
    skipped: prev.skipped + next.skipped,
    unmatched: prev.unmatched,
  };
}

export function LetterboxdImport({ mode }: LetterboxdImportProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { accentHex } = useAccentColor();
  const markImportSkipped = useOnboardingStore((state) => state.markLetterboxdImportSkippedAction);
  const markImportCompleted = useOnboardingStore(
    (state) => state.markLetterboxdImportCompletedAction,
  );
  const { isImporting, error, importFromUsername, importFromFile, resolve } = useLetterboxdImport();

  const usernameState = useNativeState("");
  const [hasUsername, setHasUsername] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [unmatched, setUnmatched] = useState<UnmatchedRow[]>([]);

  const onImported = useCallback(
    (result: ImportSummary) => {
      markImportCompleted();
      setSummary((prev) => mergeSummary(prev, result));
      setUnmatched((prev) => [...prev, ...result.unmatched]);
    },
    [markImportCompleted],
  );

  const handleUsername = useCallback(async () => {
    const value = usernameState.value.trim();
    if (!value) return;
    const result = await importFromUsername(value);
    if (result) onImported(result);
  }, [importFromUsername, onImported, usernameState]);

  const handleFile = useCallback(async () => {
    const result = await importFromFile();
    if (result) onImported(result);
  }, [importFromFile, onImported]);

  const handleOpenExport = useCallback(() => {
    hapticTap();
    Linking.openURL(EXPORT_URL);
  }, []);

  const handlePick = useCallback(
    async (row: UnmatchedRow, candidate: TmdbCandidate) => {
      const result = await resolve([
        {
          tmdb_id: candidate.tmdb_id,
          target: row.target,
          rating: row.rating,
          comment: row.comment,
        },
      ]);
      if (!result) return;
      setUnmatched((prev) => prev.filter((item) => item !== row));
      setSummary((prev) => (prev ? { ...prev, imported: prev.imported + result.imported } : prev));
    },
    [resolve],
  );

  const handleSkipRow = useCallback((row: UnmatchedRow) => {
    setUnmatched((prev) => prev.filter((item) => item !== row));
  }, []);

  const finish = useCallback(() => {
    hapticTap();
    if (mode === "onboarding") {
      if (!summary) markImportSkipped();
      router.replace("/taste");
    } else {
      router.back();
    }
  }, [markImportSkipped, mode, router, summary]);

  const summaryText = summary
    ? unmatched.length > 0
      ? t("import.summary", { imported: summary.imported, unmatched: unmatched.length })
      : t("import.summaryNoUnmatched", { imported: summary.imported })
    : null;

  return (
    <Host
      matchContents={false}
      ignoreSafeArea="keyboard"
      useViewportSizeMeasurement
      style={{ flex: 1 }}>
      <Form modifiers={[tint(accentHex)]}>
        <QuickConnectSection
          username={usernameState}
          isImporting={isImporting}
          canImport={hasUsername}
          onChangeText={(value) => setHasUsername(value.trim().length > 0)}
          onImport={handleUsername}
        />

        <FullHistorySection
          isImporting={isImporting}
          onOpenExport={handleOpenExport}
          onUpload={handleFile}
        />

        {summaryText || error ? (
          <Section>
            {summaryText ? (
              <Label systemImage="checkmark.circle" title={summaryText} color={theme.text} />
            ) : null}
            {error ? (
              <Label systemImage="exclamationmark.triangle" title={error} color={theme.error} />
            ) : null}
          </Section>
        ) : null}

        <UnmatchedSection
          rows={unmatched}
          isImporting={isImporting}
          onPick={handlePick}
          onSkip={handleSkipRow}
        />

        <Section>
          <Button
            label={mode === "onboarding" ? t("import.done") : t("import.close")}
            onPress={finish}
          />
          {mode === "onboarding" ? (
            <Button
              label={t("import.skipAll")}
              onPress={finish}
              modifiers={[tint(theme.textSecondary)]}
            />
          ) : null}
        </Section>
      </Form>
    </Host>
  );
}
