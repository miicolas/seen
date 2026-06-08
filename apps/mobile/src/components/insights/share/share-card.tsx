import type { ShareRecap } from "@/services/analytics";

import { BacklogCard } from "./backlog-card";
import { TasteCard } from "./taste-card";
import { WeeklyCard } from "./weekly-card";

// Picks the template's card. Kept separate from the capture frame so the same set
// of cards can be previewed and snapshotted from one place.
export function ShareCard({ recap, accent }: { recap: ShareRecap; accent: string }) {
  if (recap.template === "weekly") return <WeeklyCard recap={recap} accent={accent} />;
  if (recap.template === "taste") return <TasteCard recap={recap} accent={accent} />;
  return <BacklogCard recap={recap} accent={accent} />;
}
