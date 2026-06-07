import { useCallback } from "react";

import { useWhatsNewReleases } from "@/hooks/whats-new/use-whats-new-releases";
import { useWhatsNewStore } from "@/store/use-whats-new-store";

export function useWhatsNew() {
  const { releases, isLoading } = useWhatsNewReleases();
  const seenIds = useWhatsNewStore((state) => state.seenIds);
  const markSeenAction = useWhatsNewStore((state) => state.markSeenAction);

  // Everyone — newcomer or returning — only ever sees the latest release, and
  // only until they've seen it. Dismissing marks every release as seen.
  const latest = releases[0];
  const alreadySeen = latest ? (seenIds?.includes(latest.id) ?? false) : true;
  const features = latest && !alreadySeen ? latest.features : [];
  const shouldAutoShow = features.length > 0;

  const markSeen = useCallback(() => {
    markSeenAction(releases.map((release) => release.id));
  }, [releases, markSeenAction]);

  return { features, shouldAutoShow, markSeen, isLoading };
}
