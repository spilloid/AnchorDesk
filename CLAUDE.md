# materialticket — CLAUDE.md

Developer reference for working with this codebase. Keep this document updated as the project evolves.

---

## What this is

materialticket is a **local-first ticketing system** built on Material UI design principles. The local MariaDB database is the source of truth; external systems (ConnectWise, IMAP, RMM tools) are sync adapters — not the core.

Key design goals:
- Excellent standalone ticketing experience first
- Sync to/from external platforms second
- Strong SOLID + GoF patterns at integration boundaries
- Full audit log on every mutation (revision history)

---

## Architecture

```
web-client (React + MUI)
     │  /api/* proxied by Vite dev server → backend:8060
     ▼
backend (Fastify + TypeScript)
     │  Prisma ORM
     ▼
MariaDB :3306  ← source of truth
     │
  sync providers (Phase 3+)
     ├── ConnectWiseProvider  (reads/writes CW Manage)
     ├── ImapProvider         (planned)
     └── TacticalRmmProvider  (planned)
```

GoF patterns in use:
- **Strategy** — `TicketProvider` and `ScriptRunner` interfaces (see `src/providers/`, `src/runners/`)
- **Repository** — `src/repositories/` wraps all Prisma queries; routes never touch Prisma directly
- **Observer (append-only log)** — every mutation goes through `auditRepository.record()` before responding

---

## Local dev setup

### Prerequisites
- Node.js ≥ 18, npm
- Docker + Docker Compose

### 1. Start the database

```bash
docker compose up -d db adminer
```

Adminer (DB browser) runs at http://localhost:8081 — server `db`, user `stadmin`, db `materialticket`.

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum set DATABASE_URL and OIDC_DISABLED=true for local dev
```

### 3. Run Prisma migrations

```bash
cd backend
npx prisma db push        # push schema to DB (dev workflow — no migration files)
npx prisma studio         # optional: visual DB browser at localhost:5555
```

### 4. Start backend and frontend

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd web-client && npm run dev
```

Frontend runs at http://localhost:5173 — all `/api/*` requests proxy to backend:8060.

### 5. Full Docker stack (production-like)

```bash
docker compose up --build
```

Services: frontend :5173, backend :8060, MariaDB :3306, Adminer :8081.

---

## Environment variables

See [backend/.env.example](backend/.env.example) for the full list.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | `mysql://user:pass@host:3306/materialticket` |
| `OIDC_ISSUER_URL` | Yes (unless OIDC_DISABLED) | OIDC discovery URL |
| `OIDC_CLIENT_ID` | Yes (unless OIDC_DISABLED) | Client ID registered with IdP |
| `OIDC_CLIENT_SECRET` | Optional | Required if IdP uses confidential client |
| `OIDC_DISABLED` | Dev only | Set `true` to skip auth entirely |
| `CWM_*` | Optional | Only needed if ConnectWise sync is enabled |

### OIDC provider examples

**Azure AD:**
```
OIDC_ISSUER_URL=https://login.microsoftonline.com/<tenant-id>/v2.0
```

**Authentik:**
```
OIDC_ISSUER_URL=https://authentik.yourdomain.com/application/o/<app-slug>/
```

---

## API endpoints

### Local tickets (MariaDB — source of truth)

| Method | Path | Description |
|---|---|---|
| GET | `/tickets` | List tickets (filters: status, assignee, company, page, pageSize) |
| GET | `/tickets/:id` | Get one ticket with notes |
| POST | `/tickets` | Create ticket |
| PATCH | `/tickets/:id` | Update ticket fields |
| DELETE | `/tickets/:id` | Soft-delete (status → Deleted) |
| GET | `/tickets/:id/history` | Full audit log for this ticket |
| GET | `/tickets/:id/notes` | List notes |
| POST | `/tickets/:id/notes` | Add note |
| PATCH | `/tickets/:id/notes/:noteId` | Edit note |
| DELETE | `/tickets/:id/notes/:noteId` | Delete note |

### ConnectWise passthrough (requires CWM_* env vars)

| Method | Path | Description |
|---|---|---|
| GET | `/cw/tickets/open` | Open tickets from CW board |
| GET | `/cw/tickets/:ticketId` | Single CW ticket |
| GET | `/cw/tickets/:ticketId/notes` | CW ticket notes |
| GET | `/cw/tickets/by-resource/:resource` | CW tickets filtered by technician |

### Utility
| GET | `/ping` | Health check — returns `pong` |

---

## Key files

| File | Purpose |
|---|---|
| `backend/prisma/schema.prisma` | Database schema (single source of truth for DB structure) |
| `backend/src/db/prisma.ts` | Singleton PrismaClient |
| `backend/src/repositories/ticketRepository.ts` | All ticket DB operations + audit recording |
| `backend/src/repositories/noteRepository.ts` | All note DB operations + audit recording |
| `backend/src/repositories/auditRepository.ts` | Audit log write + query |
| `backend/src/middleware/auth.ts` | OIDC bearer token validation (works with any IdP) |
| `backend/src/providers/TicketProvider.ts` | **Strategy interface** for external sync sources |
| `backend/src/providers/ConnectWiseProvider.ts` | CW implementation of TicketProvider |
| `backend/src/routes/tickets.ts` | CRUD routes for local tickets |
| `backend/src/routes/cw.ts` | CW passthrough routes (legacy/convenience) |
| `web-client/src/api/client.ts` | Frontend API client — all fetch calls go here |
| `web-client/src/App.tsx` | Main React component, state management |
| `docs/architecture.md` | Architecture diagram and pattern rationale |
| `docs/schema.md` | Database schema documentation |
| `docs/providers.md` | How to add a new TicketProvider |

---

## Adding a new sync provider

See [docs/providers.md](docs/providers.md).

Short version:
1. Create `backend/src/providers/YourProvider.ts` implementing `TicketProvider`
2. Add your provider type to the `ProviderType` enum in `prisma/schema.prisma`
3. Insert a row into `sync_providers` with your config JSON
4. Wire it into the sync service (Phase 3)

---

## Running tests

```bash
# Backend
cd backend && npm test

# Frontend
cd web-client && npm test
```

Note: The old root-level `index.test.ts` was removed — it tested deleted CW-only routes. New tests should target the local-DB routes in `backend/src/routes/tickets.ts`.

---

## Database schema changes

Always use `prisma db push` in dev (fast iteration, no migration files). When ready for a stable migration:

```bash
cd backend
npx prisma migrate dev --name describe_your_change
```

Migration files live in `backend/prisma/migrations/`.
