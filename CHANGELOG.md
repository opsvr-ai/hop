# Changelog

## v1.0.0 (2026-05-15)

Initial hop release, forked from Hermes Agent. This release adds a Next.js web dashboard with multi-user authentication, team spaces, and an admin panel on top of the Hermes Agent engine.

### Added
- **Web Dashboard:** Next.js 16 frontend with glass-morphism design, real-time chat streaming, and conversation history
- **User Management:** Multi-user system with local accounts (bcrypt) and LDAP authentication via NextAuth v5
- **Space Management:** Team workspaces with owner/admin/member roles, personal spaces auto-created on first login
- **Invite System:** Shareable invite links for adding members to spaces
- **Admin Panel:** User management, platform branding, and LDAP configuration UI
- **Space Settings:** Per-space member management, role promotion/demotion, invite link management, and space deletion
- **API Server:** REST API with user/space header-based isolation (`X-Hermes-User`, `X-Hermes-Space`)
- **Space Isolation:** All cron jobs, agent runs, and conversations are scoped to their space
- **Data Migration:** Automatic v12 schema migration for existing users (personal space backfill, session space assignment)
- **Prisma ORM:** SQLite database for NextAuth accounts, users, and sessions

### Inherited from Hermes Agent
- Full TUI with multiline editing and slash-command autocomplete
- Multi-platform messaging gateway (Telegram, Discord, Slack, WhatsApp, Signal)
- 40+ self-registering tools with toolset system
- Built-in cron scheduler with platform delivery
- Subagent delegation and parallel task execution
- Seven terminal backends (local, Docker, SSH, Singularity, Modal, Daytona, Vercel Sandbox)
- Skills system with learning loop and FTS5 session search
- Support for OpenRouter (200+ models), OpenAI, Nous Portal, NovitaAI, NVIDIA NIM, and more

### Changed
- Project renamed from "Hermes Agent" to "hop"
- Repository moved to [github.com/opsvr-ai/hop](https://github.com/opsvr-ai/hop)
- Web frontend and backend now live in the same repository (`web/` directory)
- Old Vite web app replaced with Next.js hermes-ops-web
