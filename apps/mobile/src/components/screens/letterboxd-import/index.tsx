import { Button, Form, Host, Label, Section, useNativeState } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, PlatformColor, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button as RNButton } from "@/components/ui/button/button";
import { GlassButton } from "@/components/ui/button/glass-button";
import { SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { useLetterboxdImport } from "@/hooks/import/use-letterboxd-import";
import { hapticTap } from "@/lib/haptics";
import type { ImportSummary, TmdbCandidate, UnmatchedRow } from "@/services/import";
import { useOnboardingStore } from "@/store/use-onboarding-store";

import { FullHistorySection } from "./full-history-section";
import { ImportHero } from "./import-hero";
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
  const insets = useSafeAreaInsets();
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

  const isOnboarding = mode === "onboarding";

  const form = (
    <Host
      matchContents={false}
      ignoreSafeArea="keyboard"
      useViewportSizeMeasurement
      style={styles.form}>
      <Form modifiers={[tint(accentHex)]}>
        <QuickConnectSection
          mode={mode}
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

        {!isOnboarding ? (
          <Section>
            <Button label={t("import.close")} onPress={finish} />
          </Section>
        ) : null}
      </Form>
    </Host>
  );

  if (!isOnboarding) return form;

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top + SPACING.LG }}>
        <ImportHero />
      </View>
      {form}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.MD }]}>
        <GlassButton title={t("import.done")} width="fill" onPress={finish} haptic={false} />
        <RNButton
          title={t("import.skipAll")}
          variant="link"
          width="fill"
          onPress={finish}
          haptic={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Matches the SwiftUI Form's grouped background so the hero and footer
    // bands don't read as separate surfaces.
    backgroundColor: PlatformColor("systemGroupedBackground"),
  },
  form: {
    flex: 1,
  },
  footer: {
    gap: SPACING.XS,
    paddingHorizontal: SPACING.MD,
  },
});
