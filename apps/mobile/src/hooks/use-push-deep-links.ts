import * as Notifications from "expo-notifications";
import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";

import { pushDeepLinkPath, type WatchPushData } from "@/lib/push-notifications";

export function usePushDeepLinks(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const navigate = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const data = response.notification.request.content.data as WatchPushData;
      const path = pushDeepLinkPath(data);
      if (path) router.push(path as Href);
    };

    void Notifications.getLastNotificationResponseAsync().then(navigate);
    const subscription = Notifications.addNotificationResponseReceivedListener(navigate);
    return () => subscription.remove();
  }, [enabled, router]);
}
