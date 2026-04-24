# podcastindex-mcp

MCP server for the Podcast Index API — search podcasts, track appearances, monitor trending, check feed health.

## Architecture
- `src/index.ts` — MCP server bootstrap, env var validation, request handlers
- `src/api-client.ts` — HTTP client with HMAC SHA1 auth header generation
- `src/tool-handlers.ts` — 8 tool handlers with input validation and error handling
- `src/types.ts` — TypeScript interfaces and type guard functions for all tool args
- `src/__tests__/` — Vitest tests for types, API client, and tool handlers

## Key constraints
- Requires `PODCASTINDEX_API_KEY` and `PODCASTINDEX_API_SECRET` env vars at runtime
- Tests must mock HTTP — never hit the real Podcast Index API
- Uses older MCP SDK (0.6.0) and axios for HTTP

## Development
```bash
npm ci
npm run lint    # tsc --noEmit (type-check)
npm run build   # tsc (outputs to build/)
npm test        # vitest run
```

## Testing
3 test suites:
- `types.test.ts` — Type guard validation (valid/invalid inputs for all 8 arg types)
- `api-client.test.ts` — API endpoints, param forwarding, auth header generation (mocked axios)
- `tool-handlers.test.ts` — Tool dispatch, error handling, TOOLS registry integrity

## Agent workflow
- Always work on a branch. Never push directly to master.
- Create PRs targeting master. CI must pass (lint + build + test on Node 20 and 22).
- Keep changes focused — one feature or fix per PR.
- Run `npm test` locally before pushing.
