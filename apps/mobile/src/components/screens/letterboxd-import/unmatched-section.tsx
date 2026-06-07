import { Label, Section, Text } from "@expo/ui/swift-ui";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/hooks/use-theme";
import type { TmdbCandidate, UnmatchedRow } from "@/services/import";

import { UnmatchedCard } from "./unmatched-card";

interface UnmatchedSectionProps {
  rows: UnmatchedRow[];
  isImporting: boolean;
  onPick: (row: UnmatchedRow, candidate: TmdbCandidate) => void;
  onSkip: (row: UnmatchedRow) => void;
}

function withYear(title: string, year?: number | null): string {
  return year ? `${title} (${year})` : title;
}

// Each ambiguous film gets its OWN native Section (a clear card with the film name as
// header), so multiple films don't blur into one list. A lead-in section states how
// many films need a decision.
export function UnmatchedSection({ rows, isImporting, onPick, onSkip }: UnmatchedSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  if (rows.length === 0) return null;

  const plural = rows.length > 1 ? "s" : "";

  return (
    <>
      <Section title={t("import.reviewTitle")}>
        <Label
          systemImage="wand.and.stars"
          title={t("import.reviewCount", { count: rows.length, plural })}
          color={theme.textSecondary}
        />
      </Section>
      {rows.map((row) => (
        <Section
          key={row.uri ?? `${row.title}:${row.year ?? ""}`}
          title={withYear(row.title, row.year)}
          footer={<Text>{t("import.reviewHint")}</Text>}>
          <UnmatchedCard
            row={row}
            isDisabled={isImporting}
            onPick={(candidate) => onPick(row, candidate)}
            onSkip={() => onSkip(row)}
          />
        </Section>
      ))}
    </>
  );
}
