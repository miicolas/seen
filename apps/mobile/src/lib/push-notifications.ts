import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { registerPushToken } from "@/services/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePushRegistration(): Promise<boolean> {
  if (Platform.OS !== "ios" || !Device.isDevice) return false;

  const settings = await Notifications.getPermissionsAsync();
  let granted =
    settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted && settings.canAskAgain) {
    const request = await Notifications.requestPermissionsAsync();
    granted = request.granted;
  }
  if (!granted) return false;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken({ token, device_id: Device.modelId ?? undefined });
    return true;
  } catch (error) {
    console.warn("push registration failed", error);
    return false;
  }
}

export type WatchPushData = {
  type?: string;
  sessionId?: string;
  recommendationId?: string;
};

export function pushDeepLinkPath(data: WatchPushData): string | null {
  if (data.type === "media-recommendation.received") return "/media-recommendations";
  if (data.type?.startsWith("watch-session.")) {
    if (data.type === "watch-session.invited") return "/watch-invitations";
    return data.sessionId ? `/now-watching?sessionId=${data.sessionId}` : null;
  }
  return null;
}
