import { Share } from "react-native";

import { socialProfileDeepLink, TESTFLIGHT_INVITE_URL } from "@/constants/links";
import i18n from "@/lib/i18n";

// Opens the native share sheet with an invite to follow a profile. The message
// leads with the TestFlight link since the app is in beta — recipients without
// Seen must be able to install it — and ends with the in-app deep link.
// Plain-text share, so this uses RN's Share API (expo-sharing is files-only).
export async function shareProfile(params: {
  profileId: string;
  username: string;
  isMe: boolean;
}): Promise<void> {
  const message = i18n.t(params.isMe ? "share.profileMessageSelf" : "share.profileMessageOther", {
    username: params.username,
    testflightUrl: TESTFLIGHT_INVITE_URL,
    deepLink: socialProfileDeepLink(params.profileId),
  });
  await Share.share({ message });
}
