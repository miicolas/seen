# SeenBox 🎬

> A native, open-source, Letterboxd-style app for iOS — track the movies and shows you've **seen**, rate them, and build your watchlist.

SeenBox is built **iOS-first** with [Expo](https://expo.dev) (SDK 56) and a fully native UI powered by **Expo UI + SwiftUI** (`@expo/ui/swift-ui`). The backend is a [Bun](https://bun.sh) + [Elysia](https://elysiajs.com) API with Postgres, Redis, and S3. Movie data comes from [TMDB](https://www.themoviedb.org/).

This project is open source and contributions are very welcome — see [Contributing](#contributing) below.

---

## ✨ Features

- 🎞️ Browse and search movies & TV via TMDB
- ⭐ Rate and review what you've seen
- 📋 Personal watchlist
- 🍿 Import from Letterboxd
- 🔐 Sign in with Apple (Better Auth)
- 📱 100% native iOS UI (SwiftUI under the hood)

## 🧱 Tech stack

| Layer   | Tech                                                                       |
| ------- | -------------------------------------------------------------------------- |
| Mobile  | Expo SDK 56, React Native 0.85, React 19, Expo Router, `@expo/ui/swift-ui` |
| State   | Zustand, TanStack Query                                                    |
| Auth    | Better Auth (+ `@better-auth/expo`)                                        |
| API     | Bun, Elysia, Eden                                                          |
| Data    | Postgres + Drizzle ORM, Redis, S3 (MinIO locally)                          |
| Movies  | TMDB                                                                       |
| Tooling | Turborepo, bun workspaces, ESLint, Prettier, TypeScript (strict)           |

> ⚠️ SeenBox is **iOS-only**. There is no web or Android target.

## 📦 Monorepo layout

```
apps/
  mobile/   # Expo iOS app (source under src/)
  api/      # Bun + Elysia backend
packages/
  db/       # Drizzle schema & migrations
  shared/   # Shared types/utilities
```

## 🚀 Getting started

### Prerequisites

- [Bun](https://bun.sh) `1.3+` (package manager — do not use npm/yarn)
- [Xcode](https://developer.apple.com/xcode/) + iOS Simulator (macOS only)
- [Docker](https://www.docker.com/) (for local Postgres / Redis / MinIO)
- A [TMDB API token](https://www.themoviedb.org/settings/api)

### 1. Clone & install

```bash
git clone git@github.com:miicolas/seen.git
cd seen
bun install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Then fill in the values — at minimum a `TMDB_TOKEN`, a long random `BETTER_AUTH_SECRET`, and (for Apple sign-in) the `APPLE_*` credentials.

### 3. Start local infrastructure

```bash
docker compose up -d   # Postgres, Redis, MinIO
bun run db:migrate     # apply database migrations
```

### 4. Run the app

```bash
bun run dev:api        # start the backend (http://localhost:3000)
bun run dev:mobile     # start Expo, then press "i" for the iOS simulator
```

Or run everything at once with `bun run dev` (Turborepo).

## 🛠️ Useful scripts

Run from the repo root:

| Command               | Description                 |
| --------------------- | --------------------------- |
| `bun run dev`         | Run all apps (Turbo)        |
| `bun run dev:mobile`  | Run the Expo iOS app        |
| `bun run dev:api`     | Run the backend API         |
| `bun run lint`        | Lint everything             |
| `bun run typecheck`   | Type-check everything       |
| `bun run format`      | Format with Prettier        |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate`  | Apply migrations            |
| `bun run db:studio`   | Open Drizzle Studio         |

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Here's how to get involved:

1. **Find or open an issue.** Check the [issues](https://github.com/miicolas/seen/issues) for something to work on, or open a new one to propose a change. For larger features, open an issue first so we can align before you build.
2. **Fork & branch.** Fork the repo and create a descriptive branch (`feature/...`, `fix/...`, `chore/...`).
3. **Make your change.** Follow the conventions below.
4. **Verify locally.** Run `bun run ci` (lint + typecheck + format check) before pushing.
5. **Open a Pull Request** against `main` with a clear description of what and why. Link the related issue.

### Conventions

- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, …).
- **Package manager is bun** — use `bun` / `bunx`, never `npm` / `npx`.
- **Files are kebab-case** with a single primary export each; keep files small, flat, and DRY.
- **UI is SwiftUI-first** via `@expo/ui/swift-ui`; only fall back to plain React Native views when there's no native equivalent.
- User-facing text is in **English**.
- See [`AGENTS.md`](./AGENTS.md) for the full architecture and contributor guidelines.

### Good first contributions

- Bug fixes from the issue tracker
- UI polish and accessibility improvements
- Documentation improvements
- New TMDB-powered browsing/discovery features

## 📄 License

Released under the [MIT License](./LICENSE). You're free to use, modify, and distribute this software.

---

Made with ❤️ for movie lovers. If you find SeenBox useful, consider giving it a ⭐ on GitHub!
