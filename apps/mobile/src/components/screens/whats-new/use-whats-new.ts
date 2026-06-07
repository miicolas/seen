import Constants from "expo-constants";
import { useCallback } from "react";

import {
  getLatestApplicableRelease,
  shouldShowWhatsNew,
  WHATS_NEW_RELEASES,
} from "@/constants/whats-new";
import { useWhatsNewStore } from "@/store/use-whats-new-store";

export function useWhatsNew() {
  const appVersion = Constants.expoConfig?.version ?? "0.0.0";
  const lastSeenVersion = useWhatsNewStore((state) => state.lastSeenVersion);
  const setLastSeenVersion = useWhatsNewStore((state) => state.setLastSeenVersionAction);

  const release = getLatestApplicableRelease(WHATS_NEW_RELEASES, appVersion);
  const isFirstRun = lastSeenVersion === null;
  const shouldAutoShow = release !== null && shouldShowWhatsNew(release.version, lastSeenVersion);

  const markSeen = useCallback(() => {
    if (release) setLastSeenVersion(release.version);
  }, [release, setLastSeenVersion]);

  return { release, isFirstRun, shouldAutoShow, markSeen };
}
