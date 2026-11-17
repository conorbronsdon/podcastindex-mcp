# podcastindex-mcp

The repository contract for every agent runtime. Codex and other runtimes read this file directly; Claude Code reads it through `CLAUDE.md`, which imports it.

MCP server for the Podcast Index API — search podcasts, track appearances, monitor trending, check feed health.

## Architecture
- `src/index.ts` — MCP server bootstrap, env var validation, request handlers
- `src/api-client.ts` — HTTP client with HMAC SHA1 auth header generation
- `src/tool-handlers.ts` — 18 tool handlers with input validation and error handling
- `src/types.ts` — TypeScript interfaces and type guard functions for all tool args; each guard enforces what its `inputSchema` advertises (`max` 1–100, integer `id`/`since`/`before`)
- `src/__tests__/` — Vitest tests for types, API client, and tool handlers

## Key constraints
- `PODCASTINDEX_API_KEY` and `PODCASTINDEX_API_SECRET` env vars are needed for tool calls, but the server starts without them (lazy auth): warns on stderr, answers `tools/list`, and fails each `tools/call` with a clear McpError until both are set
- Tests must mock HTTP — never hit the real Podcast Index API
- Argument-validation failures return an `isError: true` tool result (MCP 2025-11-25), not a JSON-RPC `-32602` error. Missing credentials (`-32600`) and unknown tools (`-32601`) stay `McpError`s
- Uses MCP SDK 1.x and axios for HTTP; all 18 tools are read-only and declare `annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }` (enforced by a completeness test that pins the exact object)
- CI blocks on `npm audit --omit=dev --audit-level=high` — keep production dependencies free of high-severity advisories. A second, report-only step runs the full audit (`npm audit --audit-level=high`); any non-zero exit there, including an npm failure, becomes a warning annotation on the run without failing the job

## Development
```bash
npm ci
npm run lint    # tsc --noEmit (type-check)
npm run build   # tsc (outputs to build/)
npm test        # vitest run
```

## Testing
5 test suites:
- `types.test.ts` — Type guard validation (valid/invalid inputs for all 18 arg types)
- `api-client.test.ts` — API endpoints, param forwarding, auth header generation (mocked axios)
- `tool-handlers.test.ts` — Tool dispatch, error handling, TOOLS registry integrity
- `errors.test.ts` — HTTP status to typed error mapping (`src/errors.ts`)
- `engines.test.ts` — `engines`, the lockfile root and the README Node prerequisite start at the oldest CI matrix leg

## Agent workflow
- Always work on a branch. Never push directly to main.
- Create PRs targeting main. CI must pass (lint + build + test on Node 22.12, 24, and 26).
- Keep changes focused — one feature or fix per PR.
- Run `npm test` locally before pushing.
