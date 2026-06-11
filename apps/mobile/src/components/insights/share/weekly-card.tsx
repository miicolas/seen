import { Text } from "react-native";

import { formatWatchMinutes } from "@/lib/format";
import type { ShareRecap } from "@/services/analytics";

import { GenreChips } from "./genre-chips";
import { ShareCardFrame, shareCardTypography } from "./share-card-frame";

export function WeeklyCard({ recap, accent }: { recap: ShareRecap; accent: string }) {
  const genres = (recap.top_genres ?? []).map((genre) => genre.genre).slice(0, 3);

  return (
    <ShareCardFrame eyebrow="This week" accent={accent}>
      <Text style={shareCardTypography.label}>Watched time</Text>
      <Text style={shareCardTypography.hero}>{formatWatchMinutes(recap.total_minutes ?? 0)}</Text>
      <Text style={shareCardTypography.line}>
        {recap.media_count ?? 0} titles · {recap.episode_count ?? 0} episodes
      </Text>
      <GenreChips genres={genres} accent={accent} />
    </ShareCardFrame>
  );
}
