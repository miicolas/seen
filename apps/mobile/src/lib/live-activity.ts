import type { LiveActivity } from "expo-widgets";

import NowWatchingActivity, {
  type NowWatchingActivityProps,
} from "@/widgets/now-watching-activity";

let current: {
  sessionId: string;
  activity: LiveActivity<NowWatchingActivityProps>;
  propsKey: string;
} | null = null;

export function startOrUpdateLiveActivity(
  sessionId: string,
  props: NowWatchingActivityProps,
  deepLinkUrl: string,
): void {
  const propsKey = JSON.stringify(props);
  try {
    if (current?.sessionId === sessionId) {
      if (current.propsKey === propsKey) return;
      current.propsKey = propsKey;
      void current.activity.update(props).catch(() => {});
      return;
    }
    void endLiveActivity();
    current = { sessionId, activity: NowWatchingActivity.start(props, deepLinkUrl), propsKey };
  } catch {
    current = null;
  }
}

export async function endLiveActivity(): Promise<void> {
  if (!current) return;
  const { activity } = current;
  current = null;
  try {
    await activity.end("immediate");
  } catch {}
}
