import { Button, Label, Text } from "@expo/ui/swift-ui";
import {
  disabled as disabledModifier,
  font,
  foregroundStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";

import { FONT_SIZE } from "@/constants/design-tokens";
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

// One ambiguous film as native Form rows: the Letterboxd title, then the TMDB
// candidates to pick from (or an empty-state), then a skip row.
export function UnmatchedCard({ row, isDisabled, onPick, onSkip }: UnmatchedCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <>
      <Text
        modifiers={[font({ size: FONT_SIZE.MD, weight: "semibold" }), foregroundStyle(theme.text)]}>
        {withYear(row.title, row.year ? String(row.year) : undefined)}
      </Text>
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
            label={withYear(candidate.title, candidate.release_date?.slice(0, 4))}
            onPress={() => onPick(candidate)}
            modifiers={[disabledModifier(isDisabled), tint(theme.text)]}
          />
        ))
      )}
      <Button
        label={t("import.skip")}
        onPress={onSkip}
        modifiers={[disabledModifier(isDisabled), tint(theme.textSecondary)]}
      />
    </>
  );
}
