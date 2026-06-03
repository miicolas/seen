// Edge Function `tmdb` — the single server-side chokepoint for TMDB.
// Keeps the TMDB token server-side, centralizes quota/rate-limit handling, and
// caches movie details in the `movies` table (cache-aside). search/discover/find
// always hit TMDB but warm the cache with the rows they return.
//
// Call from the app:
//   supabase.functions.invoke("tmdb", { body: { action: "search", query: "dune" } })
//   supabase.functions.invoke("tmdb", { body: { action: "movie", tmdb_id: 438631 } })
//   supabase.functions.invoke("tmdb", { body: { action: "discover", params: { sort_by: "popularity.desc" } } })
//   supabase.functions.invoke("tmdb", { body: { action: "find", external_id: "tt1160419", source: "imdb_id" } })

import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  discoverMovies,
  findByExternalId,
  getMovieDetail,
  searchMovies,
  TmdbError,
} from "../_shared/tmdb.ts";
import {
  getCachedMovieDetail,
  upsertMovieDetail,
  upsertMovieList,
} from "../_shared/cache.ts";

const DEFAULT_LANGUAGE = "fr-FR";

// Warming the cache from a list response is best-effort: the caller's payload is
// the TMDB result, not the cached rows. Schedule it off the response path so it
// never adds a DB round-trip to latency (and a failed warm can't fail the
// request). `EdgeRuntime.waitUntil` keeps the instance alive until it settles.
function warmCache(work: Promise<void>): void {
  const scheduled = work.catch((err) => console.error("cache warm failed", err));
  // deno-lint-ignore no-explicit-any
  (globalThis as any).EdgeRuntime?.waitUntil?.(scheduled);
}

interface RequestBody {
  action?: "search" | "discover" | "find" | "movie";
  query?: string;
  page?: number;
  tmdb_id?: number;
  external_id?: string;
  source?: string;
  language?: string;
  params?: Record<string, string | number | boolean | undefined>;
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

  const language = body.language ?? DEFAULT_LANGUAGE;

  try {
    switch (body.action) {
      case "search": {
        if (!body.query) return jsonResponse({ error: "query is required" }, 400);
        const result = await searchMovies(body.query, body.page ?? 1, language);
        warmCache(upsertMovieList(result.results, language));
        return jsonResponse(result);
      }

      case "discover": {
        const result = await discoverMovies({
          language,
          page: body.page ?? 1,
          ...(body.params ?? {}),
        });
        warmCache(upsertMovieList(result.results, language));
        return jsonResponse(result);
      }

      case "find": {
        if (!body.external_id) {
          return jsonResponse({ error: "external_id is required" }, 400);
        }
        const result = await findByExternalId(
          body.external_id,
          body.source ?? "imdb_id",
          language,
        );
        warmCache(upsertMovieList(result.movie_results ?? [], language));
        return jsonResponse(result);
      }

      case "movie": {
        if (!body.tmdb_id) {
          return jsonResponse({ error: "tmdb_id is required" }, 400);
        }
        const cached = await getCachedMovieDetail(body.tmdb_id);
        if (cached) return jsonResponse({ ...cached, _cache: "hit" });

        const detail = await getMovieDetail(body.tmdb_id, language);
        await upsertMovieDetail(detail, language);
        return jsonResponse({ ...detail, _cache: "miss" });
      }

      default:
        return jsonResponse(
          { error: "Unknown action. Use search | discover | find | movie." },
          400,
        );
    }
  } catch (err) {
    if (err instanceof TmdbError) {
      // Map TMDB errors to HTTP. 429 carries Retry-After.
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
