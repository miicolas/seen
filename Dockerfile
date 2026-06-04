# Bun monorepo image for the Seen API.
# Railpack doesn't auto-detect Bun (it falls back to `npm install`, which can't
# resolve `workspace:*`), so we build the API explicitly with Bun here.
FROM oven/bun:1.3-alpine
WORKDIR /app

# Copy the whole workspace, then install. `.dockerignore` keeps node_modules,
# .git and build caches out of the context.
COPY . .
RUN bun install --frozen-lockfile

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "apps/api/src/index.ts"]
