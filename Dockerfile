# Bun monorepo image for the Seen API.
# Railpack doesn't auto-detect Bun (it falls back to `npm install`, which can't
# resolve `workspace:*`), so we build the API explicitly with Bun here.
FROM oven/bun:1.3-alpine
WORKDIR /app

# Copy every workspace manifest first so `bun install` is cached until deps change.
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/

RUN bun install --frozen-lockfile

# Copy the rest of the source (the start command runs the TS entry directly).
COPY . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "apps/api/src/index.ts"]
