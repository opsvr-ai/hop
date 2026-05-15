# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Development Commands

```bash
# Activate the venv
source .venv/bin/activate

# Install in editable mode with all extras
uv pip install -e ".[all,dev]"

# Run tests — ALWAYS use the wrapper for CI parity (hermetic env, TZ=UTC, -n 4)
scripts/run_tests.sh                              # full suite
scripts/run_tests.sh tests/gateway/               # one directory
scripts/run_tests.sh tests/agent/test_foo.py::test_x  # single test
scripts/run_tests.sh -v --tb=long                 # pass-through flags

# Type checking
ty

# Lint
ruff check .
```

## Web Dashboard Commands

```bash
cd web
npm install                # Install dependencies
npx prisma generate        # Generate Prisma client
npx prisma db push         # Push schema to SQLite
npm run dev                # Start dev server on :3000
npm run build              # Production build
```

## Architecture Overview

hop is built on the Hermes Agent engine. This section covers both the inherited architecture and hop-specific additions.

**Entry points** (no single `main`):
- `run_agent.py` — `AIAgent` class. The core conversation loop: receives user message, calls LLM, executes tool calls, returns response.
- `cli.py` — `HermesCLI` class. Rich + prompt_toolkit interactive terminal.
- `gateway/run.py` — `GatewayRunner`. Long-lived process running all messaging platform adapters (Telegram, Discord, Slack, WhatsApp, etc.) and the API server.

**Agent loop** (in `run_agent.py:run_conversation`): synchronous. Send `messages` → receive `response` → if `tool_calls`: execute, append result, repeat. If no tool calls: return `response.content`.

**Tool system** — 3-layer architecture:
1. `tools/registry.py` — central registry. Each `tools/*.py` self-registers at import time.
2. `toolsets.py` — `TOOLSETS` dict maps toolset names to tool name lists.
3. `model_tools.py` — imports all tool modules, queries registry for schemas, dispatches.

All tool handlers MUST return a JSON string.

**Provider system** — `providers/base.py` defines `ProviderProfile`. Each provider ships as a plugin in `plugins/model-providers/<name>/`.

**hop-specific: User & Space Management**

The system supports multi-user, multi-space isolation:

- **Backend tables** (`hermes_state.py` schema v12): `users`, `spaces`, `space_memberships`, `space_invites`
- **API server** (`gateway/platforms/api_server.py`): All endpoints extract `X-Hermes-User` and `X-Hermes-Space` headers for isolation. `_check_space_access()` guards cross-space access.
- **Web frontend** (`web/`): NextAuth v5 authenticates users, then proxies requests to the backend API with user/space headers.
- **Space isolation**: Cron jobs store `space_id` in `origin` dict. Runs store `space_id` in run status. Conversations, jobs, and runs are filtered by space.
- **API endpoints** (`/api/hermes/`): Users, spaces, members, invites, LDAP config, branding.

**API auth flow**: Web frontend → NextAuth session → `/api/hermes/*` proxy routes → `X-Hermes-User` header → backend API server → `_authorize_request()` checks `user` table → `_extract_space_id()` from header or session.

## Critical Policies

- **Prompt caching must not break**: never alter past context, change toolsets, or rebuild system prompts mid-conversation.
- **Use `get_hermes_home()` not `Path.home() / ".hermes"`**: all path resolution must go through `hermes_constants.get_hermes_home()`.
- **Plugin rule**: plugins must NOT modify core files.
- **No ranges in dependencies**: every direct dep is exact-pinned (`==X.Y.Z`).
- **Tests must not write to `~/.hermes/`**: `tests/conftest.py` redirects `HERMES_HOME` to a temp dir.
- **Web: never call Prisma directly from client components** — use API routes or server actions.

## Key Paths

| What | Where |
|------|-------|
| User config | `~/.hermes/config.yaml` |
| Secrets (API keys) | `~/.hermes/.env` |
| Sessions (SQLite) | `~/.hermes/state.db` |
| Cron job store | `~/.hermes/cron/` |
| Web Prisma schema | `web/prisma/schema.prisma` |
| Web auth config | `web/src/lib/auth.ts` |
| Web API proxy | `web/src/app/api/hermes/` |

## Known Pitfalls

- **`hermes_bootstrap` must be the first import** in entry points — handles UTF-8 stdio on Windows.
- **`tools/registry.py` has no deps** — it's imported by all tool files, keep it that way.
- **Two gateway message guards**: platform adapter queues messages when session is active, gateway runner intercepts control commands.
- **Web: API server must be running** on port 8642 for the web dashboard to function (`hop gateway`).
- **Web: `AUTH_SECRET`** must be set in `web/.env` or NextAuth will fail.
- **Schema reconciliation**: `_reconcile_columns()` in `hermes_state.py` adds missing columns via `PRAGMA table_info` — never edit the schema without updating this.
