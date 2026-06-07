---
name: whats-new
description: Add a "What's New in Seen" announcement after building a user-facing feature. Generates the SF Symbol, the FR + EN title and description, and wires them into the versioned config so the announcement sheet shows the new feature. Use when the user finished a feature and wants to announce it — e.g. "add a what's new", "announce this feature", "nouveauté", "what's new entry".
---

# What's New for Seen

Seen shows an Apple-Music-style **"What's New"** sheet listing new features (SF Symbol + title +
description) once per app version. This skill turns a freshly-built feature into an announcement
entry. **Management is code:** there is no admin panel — announcing = editing the versioned config.

The feature infra already exists:

- **Config (edit this):** `src/constants/whats-new.ts` — `WHATS_NEW_RELEASES: WhatsNewRelease[]`.
  Each feature is `{ icon: SFSymbol; title: LocalizedText; description: LocalizedText }` where
  `LocalizedText = Record<AppLanguage, string>` = `{ en: string; fr: string }`. Both languages are
  required (a missing one is a `tsc` error). `icon` is typed `SFSymbol` (an invalid symbol fails
  `tsc`).
- Rendering, seen-tracking, and the auto-trigger are already built — **do not touch** them.
- **Never touch the backend** (`apps/api`, `packages/db`). This is fully static, client-only.

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
       tests, CI, deps, backend/API/DB changes, and the What's New mechanism itself.
   - Also take the user's one-line description if they gave one. Reconcile both into a short list
     of **user-visible** features to announce. If nothing passes the visibility test and the user
     gave no description, say so and ask what they want to announce — do NOT pad the list with
     internal work.

2. **For each feature, write the content.**
   - **SF Symbol:** pick a real, semantically-matching SF Symbol (e.g. `bookmark`, `star`,
     `bell.badge`, `person.2`, `magnifyingglass`, `sparkles`). It is typed `SFSymbol` — **never
     invent a name**; if unsure it exists, choose a safe common one and say so. `tsc` will reject
     invalid names.
   - **English** title (short, ~1–3 words) + one-line description (benefit-first, Apple-Music
     tone — what the user gains, not how it's built).
   - **French** equivalent — natural FR, not a literal translation. Keep both languages in sync.

3. **Resolve the version.** Read `expo.version` from `app.json`. For the announcement to
   auto-show to existing users, its release `version` must be **greater** than the version they
   last saw. So:
   - If you're shipping these features in a new build, the release `version` should be the **next**
     app version. Add the new `WhatsNewRelease` under that version and **remind the user to set
     `app.json` `expo.version` to match** before releasing.
   - If a `WhatsNewRelease` for that version already exists, **extend** its `features` array
     instead of adding a duplicate release.

4. **Edit `src/constants/whats-new.ts`** — add the feature entries (icon + bilingual title +
   description) under the right release. Keep entries concise and consistent with existing ones.

5. **Verify.** Run `bunx tsc --noEmit` (catches bad SF Symbols and missing translations). Report
   the release version, each feature's symbol, and the FR/EN copy you added, and remind the user to
   bump `app.json` `expo.version` if they haven't.

## Rules

- Only **user-facing** features belong in What's New — no internal/refactor notes.
- Both `en` and `fr` are mandatory for every `title` and `description`.
- Never invent SF Symbols; prefer common, clearly-named ones.
- Keep copy short: title ~1–3 words, description one line.
- Edit only `src/constants/whats-new.ts` (and `app.json` version if asked) — never the backend,
  the store, the screen, or the gate.
- Follow the `naming` skill for any wording choices (`media`/`movie`/`tv`, `rating`/`review`, etc.).
