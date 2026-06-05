---
name: backend
description: Backend conventions for the Seen app — server logic lives in the Bun/Elysia API, schema lives in the Drizzle package, and the mobile client talks through the existing Eden/API clients. Use when adding server logic, API endpoints, database tables/migrations, secrets, auth, storage, or any server-side integration.
---

# Backend for Seen

**Seen's backend is `apps/api`**: a Bun/Elysia service with Better Auth, Drizzle, Postgres, Redis, and S3. Keep server-only work there; the mobile app should call the existing clients instead of reaching directly into infrastructure.

## Where things live

- `apps/api/src/modules/<feature>/` — Elysia routers, handlers, and feature models.
- `apps/api/src/auth.ts` — Better Auth server configuration.
- `packages/db/src/schema/` — Drizzle schema definitions.
- `packages/db/drizzle/` — generated SQL migrations.
- `apps/mobile/src/lib/eden.ts` and `apps/mobile/src/lib/auth-client.ts` — mobile API/auth clients.

## Client → backend

Use the existing mobile clients; don't create new clients.

```ts
import { eden } from "@/lib/eden";

const { data, error } = await eden.api.tmdb.search.get({
  query: { query: "dune", page: 1 },
});
```

Server handlers should validate auth at the API boundary and keep database credentials server-side.

## Secrets & keys (critical)

- Provider keys and database credentials live **server-side only** in the API environment.
- **Never** expose secrets to the client. `EXPO_PUBLIC_*` vars are inlined into the app bundle.
- Do AI/third-party calls inside `apps/api`, never from the app.

## Database conventions

- Lowercase snake_case identifiers; add foreign-key indexes; prefer migrations for all schema changes.
- Keep the API/database as the source of truth; client-side Zustand stores only cache/mirror it (see the `state-management` skill).

## Workflow

- Local API: `bun run dev:api`.
- Migrations: edit `packages/db/src/schema/`, run `bun run db:generate`, then `bun run db:migrate`.
- Deploy through the API hosting workflow for `apps/api`.

## Don'ts

- No provider/secret keys in the app or in `EXPO_PUBLIC_*`.
- No schema changes that bypass migrations.
