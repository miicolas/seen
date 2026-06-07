---
name: whats-new
description: Add a "What's New in Seen" announcement after building a user-facing feature. Generates the SF Symbol, the FR + EN title and description, and wires them into the backend-served config so the announcement sheet shows the new feature. Use when the user finished a feature and wants to announce it — e.g. "add a what's new", "announce this feature", "nouveauté", "what's new entry".
---

# What's New for Seen

Seen shows an Apple-Music-style **"What's New"** sheet listing new features (SF Symbol + title +
description). The content is **served dynamically by the API**, so announcing a feature only needs a
**backend deploy (Railway)** — no app version bump and no App Store release. **Management is code:**
there is no admin panel — announcing = editing the served config and deploying the API.

How it shows:

- Each **release** is a group of features identified by a stable slug **`id`** (no version number).
- The client tracks seen releases **by `id`** locally. A **newcomer sees only the latest release**;
  a returning user sees every release `id` they haven't seen yet. Dismissing marks all seen.

The feature infra already exists:

- **Config (edit this):** `apps/api/src/modules/whats-new/data.ts` — `WHATS_NEW_RELEASES`, ordered
  **newest-first** (index 0 = latest). Each feature is `{ icon: string; title; description }` where
  `title`/`description` are `{ en: string; fr: string }`. Both languages are required.
- Rendering, seen-tracking, the gate, and the mobile service/hook are already built — **do not touch**
  them (`apps/mobile/src/services/whats-new`, `.../hooks/whats-new`, `.../components/screens/whats-new`,
  `.../components/whats-new-gate.tsx`, `.../store/use-whats-new-store.ts`).

## Process

1. **Find what's new (both sources).**
   - Read recent changes: `git log --oneline -n 20` and `git diff main...HEAD` (or `git diff` for
     the working tree).
   - **Apply the visibility test to every change** — announce it ONLY if a normal user would
     *see or directly use* the result in the app. Ask: "Could the user point at this on screen,
     or do something they couldn't before?" If not, drop it.
     - **Announce (user-visible):** a new screen or tab, a new visible action/button, a new home
       widget, a redesigned view, a new setting the user toggles, visibly faster/clearer UX.
     - **Never announce (invisible to the user):** refactors, renames, internal helpers/hooks,
       native modules or transitions, performance work with no visible change, type/lint fixes,
       tests, CI, deps, and the What's New mechanism itself.
   - Also take the user's one-line description if they gave one. Reconcile both into a short list
     of **user-visible** features to announce. If nothing passes the visibility test and the user
     gave no description, say so and ask what they want to announce — do NOT pad the list with
     internal work.

2. **For each feature, write the content.**
   - **SF Symbol:** pick a real, semantically-matching SF Symbol (e.g. `bookmark`, `star`,
     `bell.badge`, `person.2`, `magnifyingglass`, `sparkles`). On the backend `icon` is a plain
     `string`, so **`tsc` no longer validates it** — be careful to use a real SF Symbol name; if
     unsure it exists, choose a safe common one and say so.
   - **English** title (short, ~1–3 words) + one-line description (benefit-first, Apple-Music
     tone — what the user gains, not how it's built).
   - **French** equivalent — natural FR, not a literal translation. Keep both languages in sync.

3. **Add or extend a release in `data.ts`.**
   - **New announcement:** add a new release at the **top** of `WHATS_NEW_RELEASES` (newest-first)
     with a short, stable, descriptive `id` slug (e.g. `"social-following"`, `"home-widget"`).
     The `id` must be unique and must never change once shipped (it's the seen-tracking key).
   - **Extending the latest, not-yet-shipped batch:** add the feature(s) to the existing top
     release's `features` array instead of creating a new release.

4. **Verify.** Run `bunx tsc --noEmit` (catches malformed entries / missing translations). Then
   confirm the served payload: start the API (`bun run dev:api`) and `curl http://localhost:3000/whats-new`.
   Report the release `id`, each feature's symbol, and the FR/EN copy you added, and remind the user
   that it goes live on the **next API deploy (Railway)** — no `app.json` bump, no App Store release.

## Rules

- Only **user-facing** features belong in What's New — no internal/refactor notes.
- Both `en` and `fr` are mandatory for every `title` and `description`.
- Each release needs a unique, stable `id` slug; never reuse or rename a shipped `id`.
- Never invent SF Symbols; prefer common, clearly-named ones (no type check on the backend).
- Keep copy short: title ~1–3 words, description one line.
- Edit only `apps/api/src/modules/whats-new/data.ts` — never the store, the screen, the gate, the
  mobile service/hook, or `app.json`.
- Follow the `naming` skill for any wording choices (`media`/`movie`/`tv`, `rating`/`review`, etc.).
