import { treaty } from "@elysia/eden";
import type { App } from "@seen/api";

import { apiBaseUrl, authClient } from "@/lib/auth-client";

export const api = treaty<App>(apiBaseUrl, {
  fetch: {
    credentials: "omit",
  },
  headers() {
    const cookie = authClient.getCookie();
    return cookie ? { Cookie: cookie } : {};
  },
});

export const eden = api as unknown as Record<string, any>;

export class EdenApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "EdenApiError";
    this.code = options?.code;
    this.status = options?.status;
  }
}

export async function unwrapEden<T>(
  response: Promise<{
    data: T | null;
    error: unknown;
    status?: number;
    response?: Response;
  }>,
): Promise<T> {
  const { data, error, response: rawResponse } = await response;
  if (error) {
    const edenError = error as {
      value?: unknown;
      status?: number;
    };

    if (
      edenError.value &&
      typeof edenError.value === "object" &&
      "error" in edenError.value &&
      typeof edenError.value.error === "string"
    ) {
      const value = edenError.value as { error: string; code?: string };
      throw new EdenApiError(value.error, {
        code: value.code,
        status:
          typeof edenError.status === "number" ? edenError.status : undefined,
      });
    }

    if (
      edenError.value &&
      typeof edenError.value === "object" &&
      "message" in edenError.value &&
      typeof edenError.value.message === "string"
    ) {
      const value = edenError.value as { message: string; code?: string };
      throw new EdenApiError(value.message, {
        code: value.code,
        status:
          typeof edenError.status === "number" ? edenError.status : undefined,
      });
    }

    throw error instanceof Error ? error : new Error("Request failed");
  }

  if (data == null) {
    if (rawResponse?.status === 204) return undefined as T;
    throw new Error("Request returned no data.");
  }

  return data;
}
