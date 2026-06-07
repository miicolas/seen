---
name: "clean-commits"
description: "Split an unstaged/messy working tree into a clean, logically-grouped series of Conventional Commits on the current branch. Use when the user asks to commit work properly, split a big diff into separate commits, or tidy up the branch before a PR."
---

# Clean commits

## Overview

Take whatever is in the working tree (modified + untracked files) and turn it into a small series of **focused, logically-grouped commits** on the current branch — each commit is one coherent change, builds on its own conceptually, and has a clear Conventional Commit message. Never one giant "wip" commit, never a commit that mixes unrelated concerns.

## When to use

- "commit my work properly" / "fais les commits proprement"
- "split this diff into clean commits"
- Tidying a feature branch before opening a PR.

Do **not** push or open a PR unless the user explicitly asks — this skill stops at commits.

## Process

1. **Survey the tree.** Run `git status --short`, `git branch --show-current`, and `git log --oneline -8` (to match the existing commit-message style). Confirm you are on a feature branch, not the default branch — if on `main`, ask before proceeding.

2. **Read the diffs.** `git diff` for modified files and read the new/untracked files. You must understand *what each change does* before grouping — group by **intent**, not by directory or file type.

3. **Drop the noise.** Restore build artifacts / generated files that got dirtied and shouldn't be committed (e.g. `.turbo/*.log`, caches). `git restore <file>`. If something is gitignored but tracked, leave it out of every commit.

4. **Fix obvious breakage you find.** A clean commit must not knowingly ship a broken file. If you spot a typo in a manifest (invalid semver, bad JSON), a stray debug line, etc. while reading the diff, fix it and fold the fix into the most relevant commit — and tell the user you did.

5. **Plan the groups.** Decide the commit list before staging anything. Each commit = one concern: a feature, a fix, a refactor, a config/build change, a UI tweak. Shared infrastructure that a feature depends on (e.g. an auth change a new upload flow needs) is its own earlier commit. The dominant feature of the branch usually owns its locale/strings/lockfile changes.

6. **Stage explicitly, never `git add -A`.** Stage each group with explicit paths: `git add <paths...>`. Use directories for whole new modules (`git add apps/api/src/modules/import/`). For a single file whose hunks belong to different commits, split with `git add -p` (or `git apply --cached`) — but don't over-engineer: splitting a locale file hunk-by-hunk across 3 commits is rarely worth the fragility; bundle it with its main consumer and say so.

7. **Verify each stage before committing.** `git status --short` to confirm exactly the intended paths are staged (green) and nothing leaked in.

8. **Commit with a Conventional Commit message.** `type(scope): summary` — types: `feat`, `fix`, `refactor`, `chore`, `build`, `docs`, `style`, `test`, `perf`. Scope optional but helpful (`feat(auth):`, `feat(import):`). Imperative mood, lowercase summary, no trailing period. Match the casing/style already used in `git log`. Use the repo's required trailer if it has one.

9. **Repeat** until `git status` is clean (except intentionally-excluded artifacts).

10. **Report.** Show the user the final `git log --oneline` of the new commits and a one-line note per commit on what it contains and anything you fixed/excluded.

## Rules

- One concern per commit. If a message needs "and", reconsider the split.
- Never mix a refactor with a behavior change in the same commit.
- Order commits so the history reads sensibly (infra/deps → feature → UI/config polish).
- Don't amend or rewrite existing commits unless asked.
- Don't push, tag, or open a PR unless asked.
