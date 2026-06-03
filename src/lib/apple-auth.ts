import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

import { supabase } from "@/lib/supabase";
import type { SignInWithIdTokenCredentials } from "@supabase/supabase-js";
import type { AppleAuthenticationFullName } from "expo-apple-authentication";

type AppleAuthResult =
  | { status: "signed-in" }
  | { status: "cancelled" }
  | { status: "unavailable" };

function isAppleAuthCancel(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ERR_REQUEST_CANCELED"
  );
}

function getFullNameMetadata(fullName: AppleAuthenticationFullName | null) {
  if (!fullName) {
    return null;
  }

  const metadata: Record<string, string> = {};
  const formattedName = AppleAuthentication.formatFullName(fullName).trim();

  if (formattedName) {
    metadata.full_name = formattedName;
  }

  if (fullName.givenName) {
    metadata.given_name = fullName.givenName;
  }

  if (fullName.familyName) {
    metadata.family_name = fullName.familyName;
  }

  return Object.keys(metadata).length > 0 ? metadata : null;
}

async function saveAppleNameMetadata(fullName: AppleAuthenticationFullName | null) {
  const metadata = getFullNameMetadata(fullName);

  if (!metadata) {
    return;
  }

  const { error } = await supabase.auth.updateUser({ data: metadata });

  if (error) {
    console.warn("Unable to save Apple user name metadata:", error);
  }
}

export async function signInWithApple(): Promise<AppleAuthResult> {
  const isAvailable = await AppleAuthentication.isAvailableAsync();

  if (!isAvailable) {
    return { status: "unavailable" };
  }

  const nonce = Crypto.randomUUID();

  try {
    const credential = await AppleAuthentication.signInAsync({
      nonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error("Apple did not return an identity token.");
    }

    const signInCredentials: SignInWithIdTokenCredentials = {
      provider: "apple",
      token: credential.identityToken,
      nonce,
      ...(credential.authorizationCode
        ? { access_token: credential.authorizationCode }
        : {}),
    };

    const { error } =
      await supabase.auth.signInWithIdToken(signInCredentials);

    if (error) {
      throw error;
    }

    await saveAppleNameMetadata(credential.fullName);

    return { status: "signed-in" };
  } catch (error) {
    if (isAppleAuthCancel(error)) {
      return { status: "cancelled" };
    }

    throw error;
  }
}
