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

// Eden wraps error responses in an `Error` whose `message` is `String(body)`, so
// an object body becomes the useless "[object Object]". Pull a real message out of
// the parsed body and never surface the raw stringified object.
function readEdenError(value: unknown): { message?: string; code?: string } {
  if (value && typeof value === "object") {
    const body = value as { error?: unknown; message?: unknown; code?: unknown };
    const message = typeof body.error === "string" ? body.error : body.message;
    return {
      message: typeof message === "string" ? message : undefined,
      code: typeof body.code === "string" ? body.code : undefined,
    };
  }
  return { message: typeof value === "string" ? value : undefined };
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
    const edenError = error as { value?: unknown; status?: number };
    const { message, code } = readEdenError(edenError.value);
    throw new EdenApiError(message ?? "Request failed", {
      code,
      status: typeof edenError.status === "number" ? edenError.status : undefined,
    });
  }

  if (data == null) {
    if (rawResponse?.status === 204) return undefined as T;
    throw new Error("Request returned no data.");
  }

  return data;
}
