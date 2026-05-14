# User & Space Management System Design

**Date**: 2026-05-15
**Status**: Approved
**Scope**: hermes-agent backend + hermes-ops-web frontend

## Overview

Hermes Ops 从单用户系统升级为支持企业多用户、多空间的协作平台。新增 LDAP 认证、本地账号、项目空间管理、对话隔离等功能。

### Deployment Context

- 企业内部部署，不同团队共用
- LDAP (Active Directory / OpenLDAP) 为主要身份源
- 团队间通过空间隔离

---

## 1. Data Model (Backend SQLite)

### 1.1 users table

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,                -- UUID
    login_type TEXT NOT NULL,           -- 'ldap' | 'local'
    username TEXT NOT NULL UNIQUE,      -- LDAP: sAMAccountName; local: custom
    display_name TEXT,                  -- LDAP: displayName
    email TEXT,                         -- LDAP: mail
    department TEXT,                    -- LDAP: department
    is_admin INTEGER DEFAULT 0,         -- 1 = platform admin
    password_hash TEXT,                 -- bcrypt, local accounts only
    created_at REAL NOT NULL,
    last_login_at REAL
);
```

### 1.2 spaces table

```sql
CREATE TABLE spaces (
    id TEXT PRIMARY KEY,                -- UUID or short code
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    owner_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL DEFAULT 'project',  -- 'personal' | 'project'
    created_at REAL NOT NULL
);
```

### 1.3 space_memberships table

```sql
CREATE TABLE space_memberships (
    user_id TEXT NOT NULL REFERENCES users(id),
    space_id TEXT NOT NULL REFERENCES spaces(id),
    role TEXT NOT NULL DEFAULT 'member',   -- 'owner' | 'admin' | 'member'
    joined_at REAL NOT NULL,
    PRIMARY KEY (user_id, space_id)
);
```

### 1.4 space_invites table

```sql
CREATE TABLE space_invites (
    id TEXT PRIMARY KEY,                -- random token (URL-safe, 24 bytes)
    space_id TEXT NOT NULL REFERENCES spaces(id),
    created_by TEXT NOT NULL REFERENCES users(id),
    expires_at REAL,                    -- NULL = never expires
    max_uses INTEGER,                   -- NULL = unlimited
    use_count INTEGER DEFAULT 0,
    created_at REAL NOT NULL
);
```

### 1.5 Existing table modifications

```sql
-- sessions: scope conversations to space
ALTER TABLE sessions ADD COLUMN space_id TEXT;
CREATE INDEX idx_sessions_space_id ON sessions(space_id);

-- jobs: scope cron jobs to space
ALTER TABLE jobs ADD COLUMN space_id TEXT;
CREATE INDEX idx_jobs_space_id ON jobs(space_id);
```

### Key Design Decisions

- **login_type discriminator**: `ldap` users have no password_hash, authenticate via LDAP bind. `local` users store bcrypt hash.
- **Personal spaces (type='personal') cannot be invited, deleted, or transferred.** API-level enforcement.
- **space_invites support expiration and usage limits.** Admins can create one-time or time-limited invite links.
- **sessions get space_id column** as the isolation boundary. user_id filtering is redundant since space membership already gates access.

---

## 2. Authentication Flow

### 2.1 Provider Configuration

NextAuth.js with two providers:

- **LDAP Provider**: Reads LDAP server settings from backend config endpoint. Authenticates via direct bind.
- **Credentials Provider**: Queries users table for `login_type='local'`, validates bcrypt hash.

### 2.2 Login Page

Two tabs: **LDAP Login** (default, for all regular users) and **Local Login** (for admin emergency access).

### 2.3 LDAP Login Flow

1. User submits username + password
2. NextAuth LDAP provider binds to AD/LDAP server
3. On success: query users table by username
   - User exists → update `last_login_at`
   - User does NOT exist → INSERT new row (`login_type='ldap'`, no password_hash), auto-create personal space
4. JWT session generated: `{ user: { id, username, displayName, isAdmin }, currentSpaceId: personalSpaceId }`
5. Redirect to `/chat`

### 2.4 First-Time Admin Setup

1. Server starts, check users table for any `is_admin=1` user
2. **No admin exists** → show bootstrap page
3. User sets admin username + password → INSERT users (`login_type='local'`, `is_admin=1`, bcrypt hash)
4. Auto-create admin's personal space
5. Redirect to login page

No default password. Admin sets their own password on first run.

### 2.5 Space Switching

- Logged-in user defaults to their personal space
- Top bar has a space switcher dropdown showing personal space + joined project spaces
- Switching updates JWT session's `currentSpaceId`
- All subsequent API requests carry the new `X-Hermes-Space` header

### 2.6 Session JWT Structure

```typescript
{
  user: {
    id: string,
    username: string,
    displayName: string,
    email: string | null,
    isAdmin: boolean,
    personalSpaceId: string,
  },
  currentSpaceId: string,
  iat: number,
  exp: number,
}
```

---

## 3. Space Management

### 3.1 Space Creation

1. User clicks "+ New Space", enters name and optional description
2. INSERT into spaces (`type='project'`, `owner_id=currentUser`)
3. INSERT into space_memberships (`role='owner'`)
4. Auto-switch to the new space

### 3.2 Space Settings Page (`/space/<id>/settings`)

- Basic info: name, description (editable by owner/admin)
- Member list with role badges and promote/demote/remove actions
- Invite link section: create, copy, reset, delete invitation links
- Delete space button (owner only)

### 3.3 Invite URL Flow

1. Admin creates invite at `POST /api/spaces/{id}/invites` with optional `max_uses` and `expires_in_hours`
2. Returns `{ invite_url: "/join/<token>" }`
3. Admin shares link via enterprise IM/email
4. Recipient opens `/join/<token>`:
   - Not logged in → redirect to login, return to invite URL after
   - Logged in → show confirmation: "You're invited to join 「Space Name」"
   - Click "Join" → INSERT membership (`role='member'`), increment `use_count`
   - Redirect to the space
5. Invite auto-expires when: `expires_at < now` OR `use_count >= max_uses`

### 3.4 Permissions Matrix

| Action | Personal Space | Project Space |
|--------|:---:|:---:|
| View sessions/members | Owner only | All members |
| Create/run cron jobs | Owner only | All members |
| Manage members | N/A | Owner, admin |
| Create invites | Forbidden | Owner, admin |
| Leave space | Forbidden | Non-owner members |
| Delete space | Forbidden | Owner only |

---

## 4. Platform & LDAP Configuration

### 4.1 Configuration Storage

| Config Item | Storage | Reason |
|-------------|---------|--------|
| Platform name | `config.yaml` → `branding.name` | Static, restart to apply |
| Platform logo | `~/.hermes/branding/logo.png` | Binary file |
| LDAP URL, Base DN, bind DN, filters | `config.yaml` → `ldap.*` | Static |
| LDAP bind password | `~/.hermes/.env` → `LDAP_BIND_PASSWORD` | Sensitive, must isolate |
| LDAP admin group DN | `config.yaml` → `ldap.adminGroup` | Members auto-receive `is_admin=1` |

**LDAP Admin Group Sync**: During LDAP login, after bind, verify membership in the configured admin group. Members get `is_admin=1`; non-members get `is_admin=0` (auto-demotion). Local accounts are NOT affected by LDAP group sync.

### 4.2 Admin Settings UI (`/admin/settings`)

- Platform branding section: name input, logo upload with preview
- LDAP configuration section: URL, Base DN, bind account, bind password, user filter, attribute mappings
- "Test Connection" button → `POST /v1/config/ldap/test`
- Save button → `POST /v1/config/branding`

### 4.3 Backend Config Endpoints

```
GET  /v1/config/branding   → { name, logo_url, ldap: { url, baseDN, bindDN, userFilter, displayNameAttr, emailAttr, deptAttr } }
POST /v1/config/branding   → Update config (admin only)
POST /v1/config/ldap/test  → Test LDAP connection with provided credentials (does not save)
```

### 4.4 NextAuth Dynamic LDAP Config

NextAuth's LDAP provider reads config dynamically from backend at auth time. Implementation approach:

```typescript
// auth.ts — LDAP provider uses a factory function
function createLdapProvider(): LdapProvider {
  return LdapProvider({
    async server() { return (await fetchBackendConfig()).ldap.url; },
    async baseDN() { return (await fetchBackendConfig()).ldap.baseDN; },
    // ... all fields from backend /v1/config/branding
  });
}
```

This ensures NextAuth always uses the latest LDAP settings without restarting the frontend. The config is fetched from `http://localhost:8642/v1/config/branding` (local loopback, no auth needed for LDAP info).

---

## 5. Conversation Isolation

### 5.1 Isolation Principle

All data is scoped to a space. No space can see another space's sessions, cron jobs, skills, or memory. The isolation is enforced at the API layer, not just the UI layer.

### 5.2 Implementation

All API requests carry `X-Hermes-Space: <space_id>` header. Backend enforces:

| Endpoint | Isolation Method |
|----------|-----------------|
| `GET /v1/sessions` | `WHERE space_id = ?` |
| `POST /v1/chat/completions` | INSERT with space_id from header |
| `GET /v1/sessions/{id}` | Verify session's space_id matches header, else 404 |
| `GET /v1/memory` | Filter memory provider scope by space_id |
| `GET /v1/jobs` | `WHERE space_id = ?` |
| `POST /v1/jobs` | INSERT with space_id from header |
| `PATCH /v1/jobs/{id}` | Verify job's space_id matches header |
| `DELETE /v1/jobs/{id}` | Verify job's space_id matches header |

### 5.3 Frontend Injection

All `/api/hermes/*` proxy requests automatically attach `X-Hermes-Space` from the JWT session's `currentSpaceId`. The proxy route handler reads the header and forwards it upstream.

### 5.4 No Cross-Space Data

- Cron jobs, skills, memory — all scoped to space
- Even admins must switch to a specific space to operate
- Personal space data is never visible to anyone except the owner

---

## 6. Backend API Endpoints (New)

All endpoints require `Authorization: Bearer <key>` (when API key configured).

### User endpoints

```
GET    /v1/users/me              → Current user info (from X-Hermes-User header)
GET    /v1/users                 → List users (admin only, paginated)
PATCH  /v1/users/{id}/admin      → Toggle admin status (admin only)
```

### Space endpoints

```
GET    /v1/spaces                → List spaces current user belongs to
POST   /v1/spaces                → Create project space
GET    /v1/spaces/{id}           → Space detail (requires membership)
PATCH  /v1/spaces/{id}           → Update space name/description (owner/admin)
DELETE /v1/spaces/{id}           → Delete space (owner only, not personal)
GET    /v1/spaces/{id}/members   → List members
PATCH  /v1/spaces/{id}/members/{userId} → Update member role
DELETE /v1/spaces/{id}/members/{userId} → Remove member

POST   /v1/spaces/{id}/invites       → Create invite link
GET    /v1/spaces/{id}/invites       → List invites
DELETE /v1/spaces/{id}/invites/{inviteId} → Revoke invite
POST   /v1/invites/{token}/join      → Accept invite (X-Hermes-User header)
GET    /v1/invites/{token}           → Preview invite (space name, no auth)
```

### Config endpoints

```
GET    /v1/config/branding       → Branding + LDAP config (no auth for LDAP info)
POST   /v1/config/branding       → Update branding config (admin only)
POST   /v1/config/ldap/test      → Test LDAP connection (admin only)
```

### Auth endpoints (internal)

```
POST   /v1/auth/init             → Bootstrap first admin (only when no admin exists)
```

---

## 7. Frontend Pages (New & Modified)

### New Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | LDAP + local login tabs |
| Admin Setup | `/setup` | First-run admin account creation |
| Space Settings | `/space/[id]/settings` | Member management, invites, space config |
| Join Invite | `/join/[token]` | Accept space invitation |
| Admin Settings | `/admin/settings` | Platform branding, LDAP config |

### Modified Pages

| Page | Changes |
|------|---------|
| `chat/page.tsx` | Add space switcher in header; filter sessions by space |
| `ai/jobs/page.tsx` | Scope jobs to current space |
| `ai/sessions/page.tsx` | Filter sessions by space_id |
| `layout.tsx` | Read `currentSpaceId` from session, inject space header |
| `sidebar.tsx` | Update nav items for new pages |

### Header Bar (new shared component)

```
┌──────────────────────────────────────────────────────────┐
│ [🔽 我的空间 ▾]                    Hermes Ops    [👤 ▾] │
└──────────────────────────────────────────────────────────┘
```

- Space switcher: dropdown with personal + project spaces + "Create Space" action
- User menu: display name, admin badge, settings link, logout

---

## 8. Implementation Order

1. **Backend data foundation** — SQLite tables + migrations
2. **Backend user/space API endpoints** — CRUD for users, spaces, memberships, invites
3. **NextAuth configuration** — LDAP + Credentials providers
4. **Login/setup pages** — `/login`, `/setup`
5. **Space switcher + header** — shared layout component
6. **Space settings page** — member management, invites
7. **Join invite flow** — `/join/[token]` page
8. **Admin settings page** — branding + LDAP config
9. **Conversation isolation** — add `space_id` filtering to all endpoints
10. **Migration of existing data** — on first upgrade, a migration script creates a "Legacy" project space and assigns all existing sessions/jobs without a `space_id` to it. The first admin can then reorganize as needed.

---

## 9. Key Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth provider | NextAuth (LDAP + Credentials) | Mature ecosystem, built-in LDAP support |
| Auth model | Pure LDAP, no local mirror | No data redundancy, always current |
| Local accounts | Admin bootstrap + emergency only | Minimal surface area |
| Admin assignment | LDAP group + manual toggle | Flexible, enterprise-friendly |
| Space model | Project-level, multi-membership | Supports cross-team collaboration |
| Personal space | Private sandbox, no invites | Guaranteed privacy per user |
| Data isolation | API-level via X-Hermes-Space header | Enforced, not optional |
| LDAP config | Single source, array-ready schema | Simple start, extensible |
| Admin initial setup | Set own password, no default | Security best practice |
