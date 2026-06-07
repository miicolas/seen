import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const BEARER_TOKEN_KEY = "seen_bearer_token";

function cleanCookie(cookie: string) {
  return cookie.trim().replace(/^;\s*/, "");
}

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (!authToken) return;

      SecureStore.setItemAsync(BEARER_TOKEN_KEY, authToken).catch((error) => {
        console.warn("Unable to persist bearer token:", error);
      });
    },
  },
  plugins: [
    expoClient({
      scheme: "seen",
      storagePrefix: "seen",
      storage: SecureStore,
    }),
  ],
});

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookie = authClient.getCookie();
  if (cookie?.trim()) {
    return { Cookie: cleanCookie(cookie) };
  }

  const token = await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  return {};
}

export async function clearAuthData() {
  await Promise.all([
    SecureStore.deleteItemAsync(BEARER_TOKEN_KEY),
    SecureStore.deleteItemAsync("seen_cookie"),
    SecureStore.deleteItemAsync("seen_session_data"),
  ]);
}
