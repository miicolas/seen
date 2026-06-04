import type { TFunction } from "i18next";

import { formatDate } from "@/lib/format";
import type { CrewMember, InfoRowData } from "../media-detail/types";

interface EpisodeInfoData {
  episodeNumber: number;
  seasonNumber: number;
  seriesTitle: string;
  airDate?: string;
  runtime?: string;
  crew: CrewMember[];
}

export function buildEpisodeInfoRows(
  data: EpisodeInfoData,
  t: TFunction,
): InfoRowData[] {
  const directors = crewNames(data.crew, ["Director"]);
  const writers = crewNames(data.crew, ["Writer", "Screenplay", "Teleplay"]);

  return [
    { label: t("episode.series"), value: data.seriesTitle },
    Number.isInteger(data.seasonNumber)
      ? { label: t("episode.season"), value: `${data.seasonNumber}` }
      : null,
    Number.isInteger(data.episodeNumber)
      ? { label: t("episode.episode"), value: `${data.episodeNumber}` }
      : null,
    data.airDate
      ? { label: t("episode.airDate"), value: formatDate(data.airDate)! }
      : null,
    data.runtime ? { label: t("episode.runtime"), value: data.runtime } : null,
    directors ? { label: t("episode.directing"), value: directors } : null,
    writers ? { label: t("episode.writing"), value: writers } : null,
  ].filter((row): row is InfoRowData => row != null);
}

function crewNames(crew: CrewMember[], jobs: string[]): string | undefined {
  const names = crew
    .filter((member) => member.job && jobs.includes(member.job))
    .map((member) => member.name)
    .filter(Boolean);

  return Array.from(new Set(names)).join(", ") || undefined;
}
