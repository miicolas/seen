import type { ShareRecap } from "@/services/analytics";

import { BacklogCard } from "./backlog-card";
import type { ShareCardFormat } from "./share-card-frame";
import { StatsCard } from "./stats-card";
import { TasteCard } from "./taste-card";
import { WeeklyCard } from "./weekly-card";

// Picks the template's card. Kept separate from the capture frame so the same set
// of cards can be previewed and snapshotted from one place.
export function ShareCard({
  recap,
  accent,
  format,
}: {
  recap: ShareRecap;
  accent: string;
  format: ShareCardFormat;
}) {
  if (recap.template === "weekly")
    return <WeeklyCard recap={recap} accent={accent} format={format} />;
  if (recap.template === "taste")
    return <TasteCard recap={recap} accent={accent} format={format} />;
  if (recap.template === "stats")
    return <StatsCard recap={recap} accent={accent} format={format} />;
  return <BacklogCard recap={recap} accent={accent} format={format} />;
}
