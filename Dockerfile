# podcastindex-mcp — stdio MCP server for the Podcast Index API
# Build:  docker build -t podcastindex-mcp .
# Run:    docker run -i --rm -e PODCASTINDEX_API_KEY=... -e PODCASTINDEX_API_SECRET=... podcastindex-mcp

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm ci --ignore-scripts && npm run build

FROM node:22-alpine
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
