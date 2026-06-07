import { Button, Label } from "@expo/ui/swift-ui";
import { disabled as disabledModifier, tint } from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/hooks/use-theme";
import type { TmdbCandidate, UnmatchedRow } from "@/services/import";

interface UnmatchedCardProps {
  row: UnmatchedRow;
  isDisabled: boolean;
  onPick: (candidate: TmdbCandidate) => void;
  onSkip: () => void;
}

function withYear(title: string, year?: string): string {
  return year ? `${title} (${year})` : title;
}

// Body of one ambiguous film's Section: the TMDB candidates to pick from (each reads
// as "choose this match"), or an empty-state, then an explicit "don't import" row.
export function UnmatchedCard({ row, isDisabled, onPick, onSkip }: UnmatchedCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <>
      {row.candidates.length === 0 ? (
        <Label
          systemImage="magnifyingglass"
          title={t("import.noMatch")}
          color={theme.textSecondary}
        />
      ) : (
        row.candidates.map((candidate) => (
          <Button
            key={candidate.tmdb_id}
            systemImage="checkmark.circle"
            label={withYear(candidate.title, candidate.release_date?.slice(0, 4))}
            onPress={() => onPick(candidate)}
            modifiers={[disabledModifier(isDisabled), tint(theme.text)]}
          />
        ))
      )}
      <Button
        systemImage="xmark.circle"
        label={t("import.skipFilm")}
        onPress={onSkip}
        modifiers={[disabledModifier(isDisabled), tint(theme.textSecondary)]}
      />
    </>
  );
}
