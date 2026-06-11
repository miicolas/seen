import { StyleSheet, Text } from "react-native";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import type { ShareRecap } from "@/services/analytics";

import { GenreChips } from "./genre-chips";
import { ShareCardFrame, shareCardTypography } from "./share-card-frame";

export function TasteCard({ recap, accent }: { recap: ShareRecap; accent: string }) {
  const genres = (recap.top_genres ?? []).map((genre) => genre.genre).slice(0, 3);
  const movies = recap.media_type_mix?.movie ?? 0;
  const tv = recap.media_type_mix?.tv ?? 0;
  const total = movies + tv;
  const moviePct = total > 0 ? Math.round((movies / total) * 100) : 0;

  return (
    <ShareCardFrame eyebrow="My taste" accent={accent}>
      <Text style={shareCardTypography.label}>Current era</Text>
      <Text style={[shareCardTypography.hero, styles.hero]}>{recap.current_era?.label ?? "—"}</Text>
      <GenreChips genres={genres} accent={accent} />
      <Text style={[shareCardTypography.line, styles.line]}>
        {moviePct}% movies · {100 - moviePct}% series · {recap.total_logged ?? 0} logged
      </Text>
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  hero: {
    fontSize: FONT_SIZE.HEADING_LG,
    letterSpacing: -1,
  },
  line: {
    marginTop: SPACING.SM,
  },
});
