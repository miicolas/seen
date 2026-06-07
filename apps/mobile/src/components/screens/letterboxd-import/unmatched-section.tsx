import { Section, Text } from "@expo/ui/swift-ui";
import { useTranslation } from "react-i18next";

import type { TmdbCandidate, UnmatchedRow } from "@/services/import";

import { UnmatchedCard } from "./unmatched-card";

interface UnmatchedSectionProps {
  rows: UnmatchedRow[];
  isImporting: boolean;
  onPick: (row: UnmatchedRow, candidate: TmdbCandidate) => void;
  onSkip: (row: UnmatchedRow) => void;
}

export function UnmatchedSection({ rows, isImporting, onPick, onSkip }: UnmatchedSectionProps) {
  const { t } = useTranslation();
  if (rows.length === 0) return null;

  return (
    <Section title={t("import.reviewTitle")} footer={<Text>{t("import.reviewHint")}</Text>}>
      {rows.map((row) => (
        <UnmatchedCard
          key={row.uri ?? `${row.title}:${row.year ?? ""}`}
          row={row}
          isDisabled={isImporting}
          onPick={(candidate) => onPick(row, candidate)}
          onSkip={() => onSkip(row)}
        />
      ))}
    </Section>
  );
}
