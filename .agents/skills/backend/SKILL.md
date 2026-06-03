---
name: backend
description: Backend conventions for the Seen app — Supabase is the backend. Server-side logic and third-party/AI API calls run in Supabase Edge Functions; schema lives in Supabase migrations with RLS; the client talks to it through the existing supabase client. Use when adding server logic, API endpoints, edge functions, database tables/migrations, RLS policies, secrets, or any server-side/AI integration.
---

# Backend (Supabase) for Seen

**Seen's backend is Supabase** — there is no separate server. The reference app (Code With Beto / Endlessly) used a standalone Hono app on Cloudflare Workers for server logic and AI calls; in Seen that role is filled by **Supabase Edge Functions**, with schema in **Supabase migrations** and access controlled by **RLS**.

For deep Supabase work, also use the existing **`supabase`** and **`supabase-postgres-best-practices`** skills. This skill is the Seen-specific routing/conventions layer on top of them.

## Where things live

- `supabase/functions/<name>/index.ts` — Edge Functions (server-side logic, AI/3rd-party calls).
- `supabase/migrations/*.sql` — versioned schema (tables, policies, functions). Schema is currently empty; add migrations rather than editing via Studio so changes are tracked.
- `supabase/config.toml` — local stack config (`supabase start`).
- `src/lib/supabase.ts` — the singleton client used by the app.

## Client → backend

Use the existing client; don't create new clients.

```ts
import { supabase } from "@/lib/supabase";

// Data (source of truth) — direct table access, gated by RLS:
const { data, error } = await supabase.from("films").select("*");

// Server logic / AI — call an Edge Function:
const { data, error } = await supabase.functions.invoke("recommend", {
  body: { filmId },
});
```

Edge Functions run authenticated with the caller's JWT — read it inside the function to enforce per-user access.

## Secrets & keys (critical)

- Provider keys (OpenAI, etc.) and any secret live **server-side only**: `supabase secrets set OPENAI_API_KEY=...`, read via `Deno.env.get(...)` inside the function.
- **Never** expose secrets to the client. `EXPO_PUBLIC_*` vars are inlined into the app bundle — only the Supabase URL and the publishable/anon key belong there (as already set in `.env.development` / `.env.production`).
- Do AI/3rd-party calls **inside Edge Functions**, never from the app.

## Database conventions

- Every user-facing table has **RLS enabled** with explicit policies (default-deny). See `supabase-postgres-best-practices`.
- Lowercase snake_case identifiers; add foreign-key indexes; prefer migrations for all schema changes.
- Keep Supabase as the **source of truth**; client-side Zustand stores only cache/mirror it (see the `state-management` skill).

## Workflow

- Local: `supabase start` (loads `.env.development` → local stack), `supabase functions serve` to run functions locally.
- Migrations: `supabase migration new <name>`, write SQL, `supabase db push` (or `db reset` locally).
- Deploy: `supabase functions deploy <name>`.

## Don'ts

- No separate backend server / Hono / Cloudflare Workers — use Supabase Edge Functions.
- No provider/secret keys in the app or in `EXPO_PUBLIC_*`.
- No schema changes that bypass migrations.
