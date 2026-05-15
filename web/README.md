# hop Web Dashboard

Next.js 16 web frontend for hop — chat interface, user & space management, and admin panel.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 + shadcn/ui v4
- **Auth:** NextAuth v5 (Credentials + LDAP)
- **Database:** Prisma + SQLite (better-sqlite3)
- **State:** Zustand + TanStack Query

## Getting Started

### Prerequisites

- Node.js 20+
- The hop API server running on port 8642 (`hop gateway`)

### Setup

```bash
cd web
npm install
npx prisma generate
npx prisma db push
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first run, the setup page at `/setup` creates the initial admin account.

### Production

```bash
npm run build
npm start
```

## Project Structure

```
web/
├── prisma/
│   └── schema.prisma          # NextAuth + user/space tables
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (providers, theme)
│   │   ├── globals.css         # Design tokens + glass-morphism utilities
│   │   ├── (auth)/             # Login, setup, join pages
│   │   │   ├── login/
│   │   │   ├── setup/
│   │   │   └── join/[token]/
│   │   ├── (dashboard)/        # Authenticated pages
│   │   │   ├── layout.tsx      # Sidebar + main layout
│   │   │   ├── chat/           # Chat interface
│   │   │   ├── admin/settings/ # Admin panel (users, branding, LDAP)
│   │   │   └── space/[id]/settings/  # Space settings
│   │   └── api/                # API routes
│   │       ├── auth/           # NextAuth endpoints
│   │       └── hermes/         # Proxy to hop backend
│   ├── components/
│   │   ├── chat/               # ChatInput, MessageBubble, QuickActions
│   │   ├── layout/             # Sidebar, Header, SpaceSwitcher
│   │   └── ui/                 # shadcn/ui primitives
│   └── lib/
│       ├── auth.ts             # NextAuth configuration
│       ├── prisma.ts           # Prisma client singleton
│       └── api.ts              # Backend API client
└── package.json
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
AUTH_SECRET="your-secret-here"
AUTH_URL="http://localhost:3000"

# Backend API
HERMES_API_URL="http://localhost:8642"
```

## Authentication

hop supports two authentication methods:

- **Local accounts:** Email + password with bcrypt hashing
- **LDAP:** Enterprise directory auth via ldap3 bind

Configure in the admin panel at `/admin/settings`.

## User & Space Model

- **Users** have accounts (local or LDAP) and belong to one or more spaces
- **Spaces** are team workspaces with owner/admin/member roles
- **Personal spaces** are auto-created on first login
- **Invite links** allow new members to join a space
- All conversations, cron jobs, and runs are isolated by space
