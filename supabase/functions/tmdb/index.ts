import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { TmdbError, type TmdbMediaType } from "../_shared/tmdb.ts";
import { handlers } from "./handlers/index.ts";
import type { HandlerContext, RequestBody } from "./types.ts";

const DEFAULT_LANGUAGE = "fr-FR";

function warmCache(work: Promise<void>): void {
  const scheduled = work.catch((err) => console.error("cache warm failed", err));
  // deno-lint-ignore no-explicit-any
  (globalThis as any).EdgeRuntime?.waitUntil?.(scheduled);
}

function mediaTypeOf(value: string | undefined): TmdbMediaType {
  return value === "tv" ? "tv" : "movie";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const handler = body.action && handlers[body.action];
  if (!handler) {
    return jsonResponse(
      { error: "Unknown action. Use search | discover | find | movie | trending." },
      400,
    );
  }

  const ctx: HandlerContext = {
    language: body.language ?? DEFAULT_LANGUAGE,
    warmCache,
    mediaTypeOf,
  };

  try {
    return await handler(body, ctx);
  } catch (err) {
    if (err instanceof TmdbError) {
      const headers: Record<string, string> = {};
      if (err.status === 429 && err.retryAfter) {
        headers["Retry-After"] = err.retryAfter;
      }
      return new Response(
        JSON.stringify({
          error: err.message,
          tmdb_status_code: err.statusCode,
        }),
        {
          status: err.status,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...headers },
        },
      );
    }
    console.error("tmdb function error", err);
    return jsonResponse({ error: "Internal error" }, 500);
  }
});
