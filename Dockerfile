# podcastindex-mcp — stdio MCP server for the Podcast Index API
# Build:  docker build -t podcastindex-mcp .
# Run:    docker run -i --rm -e PODCASTINDEX_API_KEY=... -e PODCASTINDEX_API_SECRET=... podcastindex-mcp

# Pin the multi-architecture base for reproducible MCP Catalog builds.
# Dependabot checks the pinned node/alpine tag weekly for a new digest.
FROM node:26-alpine3.24@sha256:2d984a15c9b54fd0aeb608b8e0d0d83529eb34d2966db27a1fb4f1edc3d298a3 AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm ci --ignore-scripts && npm run build

FROM node:26-alpine3.24@sha256:2d984a15c9b54fd0aeb608b8e0d0d83529eb34d2966db27a1fb4f1edc3d298a3
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/build ./build

# Runtime environment variables (optional at startup — the server starts and
# answers introspection without them; tool calls fail with a clear error
# until both are set):
#   PODCASTINDEX_API_KEY    — free API key from https://api.podcastindex.org/
#   PODCASTINDEX_API_SECRET — matching API secret

USER node
CMD ["node", "build/index.js"]
