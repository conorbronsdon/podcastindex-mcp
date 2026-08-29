# podcastindex-mcp — stdio MCP server for the Podcast Index API
# Build:  docker build -t podcastindex-mcp .
# Run:    docker run -i --rm -e PODCASTINDEX_API_KEY=... -e PODCASTINDEX_API_SECRET=... podcastindex-mcp

# Pin the multi-architecture base for reproducible MCP Catalog builds.
# Dependabot checks the Node 22 / Alpine 3.24 tag weekly for a new digest.
FROM node:22-alpine3.24@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm ci --ignore-scripts && npm run build

FROM node:22-alpine3.24@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32
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
