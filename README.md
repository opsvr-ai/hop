# hop

<p align="center">
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/中文-README-red?style=for-the-badge" alt="中文"></a>
  <a href="https://github.com/opsvr-ai/hop/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License: MIT"></a>
</p>

**hop** is a conversational AI agent with a web dashboard, user & space management, and multi-platform gateway — all in one binary. It runs on a $5 VPS or a GPU cluster, talks to you from Telegram, Discord, or the browser, and keeps conversations isolated by user and space.

It is built on the [Hermes Agent](https://github.com/NousResearch/hermes-agent) engine by Nous Research, and adds a Next.js web frontend with authentication, team spaces, and an admin panel.

## Features

| Category | What you get |
|----------|--------------|
| **AI Agent** | Full TUI with multiline editing, slash-command autocomplete, conversation history. Self-improving learning loop — creates skills from experience, improves them during use. FTS5 session search with LLM summarization. |
| **Web Dashboard** | Next.js 16 chat interface with glass-morphism design. Real-time streaming, conversation history, quick-action cards. |
| **User & Space** | Multi-user with LDAP or local accounts. Team spaces with owner/admin/member roles. Invite links. Personal spaces auto-created on first login. |
| **Multi-Platform** | Telegram, Discord, Slack, WhatsApp, Signal, and CLI — all from a single gateway process. Cross-platform conversation continuity. |
| **Cron Scheduler** | Natural-language scheduled tasks with delivery to any platform. Daily reports, nightly backups — running unattended. |
| **Delegation** | Spawn isolated subagents for parallel workstreams. Write Python scripts that call tools via RPC. |
| **Any Model** | OpenRouter (200+ models), OpenAI, Nous Portal, NovitaAI, NVIDIA NIM, MiMo, z.ai/GLM, Kimi, MiniMax, Hugging Face, or your own endpoint. Switch with a command — no code changes. |
| **Runs Anywhere** | Seven terminal backends — local, Docker, SSH, Singularity, Modal, Daytona, Vercel Sandbox. Serverless persistence so your agent hibernates when idle. |

## Architecture

```
hop/
├── run_agent.py              # AIAgent — core conversation loop
├── cli.py                    # Interactive TUI (prompt_toolkit)
├── gateway/                  # Messaging gateway + API server
│   ├── run.py                # GatewayRunner — platform lifecycle
│   └── platforms/            # Telegram, Discord, Slack, WhatsApp, API server
├── hermes_state.py           # SQLite session DB with FTS5 search
├── tools/                    # 40+ tools (self-registering)
├── skills/                   # Bundled AI skills
└── web/                      # Next.js 16 web dashboard
    ├── src/app/              # App router pages (chat, admin, settings)
    ├── src/components/       # UI components (chat, layout, auth)
    └── prisma/               # Database schema (users, spaces, accounts)
```

The Python backend serves the agent, gateway, and API. The Next.js frontend in `web/` provides the chat dashboard, authenticates users via NextAuth, and proxies agent requests to the backend API server.

## Quick Install

### Linux, macOS, WSL2

```bash
curl -fsSL https://raw.githubusercontent.com/opsvr-ai/hop/main/scripts/install.sh | bash
```

### Windows (PowerShell) — Early Beta

```powershell
irm https://raw.githubusercontent.com/opsvr-ai/hop/main/scripts/install.ps1 | iex
```

After installation:

```bash
source ~/.bashrc
hop              # start the CLI
```

## Getting Started

```bash
hop              # Interactive CLI — start a conversation
hop model        # Choose your LLM provider and model
hop gateway      # Start the messaging gateway + API server
hop setup        # Run the full setup wizard
hop web          # Start the web dashboard (Next.js dev server)
hop update       # Update to the latest version
```

## Web Dashboard Setup

The web dashboard requires the API server to be running:

```bash
# Terminal 1: Start the gateway (includes API server on port 8642)
hop gateway

# Terminal 2: Start the web frontend
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in. On first run, the setup page creates the initial admin account.

See `web/README.md` for detailed web development instructions.

## Documentation

| Section | What's Covered |
|---------|---------------|
| [Architecture](https://hermes-agent.nousresearch.com/docs/developer-guide/architecture) | Project structure, agent loop, key classes |
| [CLI Usage](https://hermes-agent.nousresearch.com/docs/user-guide/cli) | Commands, keybindings, personalities, sessions |
| [Configuration](https://hermes-agent.nousresearch.com/docs/user-guide/configuration) | Config file, providers, models, all options |
| [Messaging Gateway](https://hermes-agent.nousresearch.com/docs/user-guide/messaging) | Telegram, Discord, Slack, WhatsApp, Signal |
| [Tools & Toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools) | 40+ tools, toolset system, terminal backends |
| [Cron Scheduling](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron) | Scheduled tasks with platform delivery |

> **Note:** Core agent documentation is at [hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com/docs/). Web dashboard and user/space management docs are in this repo under `web/` and `docs/`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and PR process.

## Community

- 🐛 [Issues](https://github.com/opsvr-ai/hop/issues)

## License

MIT — see [LICENSE](LICENSE).

Built on [Hermes Agent](https://github.com/NousResearch/hermes-agent) by [Nous Research](https://nousresearch.com).
