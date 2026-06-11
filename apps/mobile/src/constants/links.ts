// While Seen is in beta, sharing always routes recipients through TestFlight.
export const TESTFLIGHT_INVITE_URL = "https://testflight.apple.com/join/asMsDpSY";

// Expo Router strips route groups like (tabs) from URLs, so the social profile
// route resolves at /profile/social/<id> under the app scheme.
export function socialProfileDeepLink(profileId: string): string {
  return `seen://profile/social/${profileId}`;
}
