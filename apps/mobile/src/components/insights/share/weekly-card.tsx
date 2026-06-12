import { useMemo } from "react";
import { Text } from "react-native";

import { formatWatchMinutes } from "@/lib/format";
import type { ShareRecap } from "@/services/analytics";

import { CardSparkline } from "./card-sparkline";
import { GenreChips } from "./genre-chips";
import { ShareCardFrame, type ShareCardFormat, shareCardTypography } from "./share-card-frame";

export function WeeklyCard({
  recap,
  accent,
  format,
}: {
  recap: ShareRecap;
  accent: string;
  format: ShareCardFormat;
}) {
  const genres = (recap.top_genres ?? []).map((genre) => genre.genre).slice(0, 3);

  const points = useMemo(
    () =>
      (recap.buckets ?? []).map((bucket) => ({
        label: bucket.label,
        value: bucket.total_minutes,
      })),
    [recap.buckets],
  );

  return (
    <ShareCardFrame eyebrow="This week" accent={accent} format={format}>
      <Text style={shareCardTypography.label}>Watched time</Text>
      <Text style={shareCardTypography.hero}>{formatWatchMinutes(recap.total_minutes ?? 0)}</Text>
      <Text style={shareCardTypography.line}>
        {recap.media_count ?? 0} titles · {recap.episode_count ?? 0} episodes
      </Text>
      <CardSparkline points={points} accent={accent} format={format} />
      <GenreChips genres={genres} accent={accent} />
    </ShareCardFrame>
  );
}
