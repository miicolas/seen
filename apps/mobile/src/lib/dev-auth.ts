import { authClient, apiBaseUrl } from "@/lib/auth-client";

const DEV_AUTH_EMAIL = "nicolas.becharat@gmail.com";
const DEV_AUTH_PASSWORD = "seen-local-dev-password";
const DEV_AUTH_NAME = "Nicolas";

function isInvalidCredentialsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: string; status?: number };
  return maybeError.code === "INVALID_EMAIL_OR_PASSWORD" || maybeError.status === 401;
}

function isAlreadyExistsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: string; status?: number };
  return maybeError.code === "USER_ALREADY_EXISTS" || maybeError.status === 409;
}

function isLocalApiUrl(url: string | undefined) {
  if (!url) {
    return false;
  }

  return /^http:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url);
}

export function isDevAuthBypassEnabled() {
  return __DEV__ && isLocalApiUrl(apiBaseUrl);
}

export async function signInWithDevSeedUser() {
  if (!isDevAuthBypassEnabled()) {
    throw new Error("Dev auth bypass is only available with the local API in dev.");
  }

  const signInResult = await authClient.signIn.email({
    email: DEV_AUTH_EMAIL,
    password: DEV_AUTH_PASSWORD,
  });

  if (!signInResult.error) {
    return;
  }

  if (!isInvalidCredentialsError(signInResult.error)) {
    throw signInResult.error;
  }

  const signUpResult = await authClient.signUp.email({
    email: DEV_AUTH_EMAIL,
    password: DEV_AUTH_PASSWORD,
    name: DEV_AUTH_NAME,
  });

  if (signUpResult.error && !isAlreadyExistsError(signUpResult.error)) {
    throw signUpResult.error;
  }

  const retryResult = await authClient.signIn.email({
    email: DEV_AUTH_EMAIL,
    password: DEV_AUTH_PASSWORD,
  });

  if (retryResult.error) {
    throw retryResult.error;
  }
}
