# Architecture

## Overview

materialticket is a local-first ticketing system. The MariaDB database is the source of truth. External platforms (ConnectWise, IMAP, etc.) are sync adapters that feed into the local store — they are not the core.

```
┌──────────────────────────────────────────────────────────────┐
│                        materialticket                        │
│                                                              │
│  ┌─────────────────┐        ┌─────────────────────────────┐ │
│  │  React + MUI    │ /api/* │  Fastify (Node.js + TS)     │ │
│  │  web-client     │───────►│  backend :8060               │ │
│  └─────────────────┘        └───────────┬─────────────────┘ │
│                                         │ Prisma ORM         │
│                                         ▼                    │
│                              ┌─────────────────────┐        │
│                              │  MariaDB :3306       │        │
│                              │  (source of truth)   │        │
│                              └──────────┬──────────┘        │
│                                         │                    │
│              ┌──────────────────────────┼─────────────────┐ │
│              │      Sync Adapters       │  (Phase 3+)     │ │
│              │  ┌────────────────┐  ┌───┴───────────────┐ │ │
│              │  │ConnectWise     │  │ IMAP              │ │ │
│              │  │Provider        │  │ Provider          │ │ │
│              │  └────────────────┘  └───────────────────┘ │ │
│              └─────────────────────────────────────────────┘ │
│                                                              │
│                  ┌──────────────────────────────────────┐   │
│                  │     RMM Runners (Phase 5+)            │   │
│                  │  MeshCentral  │  Tactical RMM         │   │
│                  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Design patterns

### Strategy — `TicketProvider` and `ScriptRunner`

External integrations are defined by interfaces, not concrete implementations. The sync service calls `provider.fetchTickets()` without knowing whether it's talking to ConnectWise, an IMAP inbox, or anything else.

```
TicketProvider (interface)
├── ConnectWiseProvider    implements TicketProvider
├── ImapProvider           implements TicketProvider (Phase 4)
└── YourProvider           implements TicketProvider (add yours)

ScriptRunner (interface, Phase 5)
├── MeshCentralRunner      implements ScriptRunner
└── TacticalRmmRunner      implements ScriptRunner
```

Adding a new integration means creating a new class — existing code does not change.

### Repository — data access layer

Routes never call Prisma directly. All database operations go through repositories:

```
ticketRepository.ts — create, list, getById, update, remove, upsertExternal
noteRepository.ts   — create, listForTicket, update, remove
auditRepository.ts  — record (write), getHistory (read)
```

Repositories are also responsible for recording audit events. Every mutation that goes through a repository automatically appends an audit log entry.

### Observer (audit log as event stream)

The `audit_log` table is an append-only event log. Every state change (create/update/delete/sync) writes a before/after snapshot to this table. This provides:
- Full revision history on any ticket
- Attribution (who changed what and when)
- An audit trail for compliance purposes

### Factory — provider instantiation (Phase 3)

When the sync service is implemented, it will instantiate providers from the `sync_providers` table using a factory function. The factory reads `type` from the row and returns the correct `TicketProvider` implementation. Adding a new provider type only requires adding a case to the factory switch.

---

## Request lifecycle

```
HTTP request
    │
    ▼
Fastify onRequest hook
    │ auth.ts — validates OIDC bearer token
    │ sets request.oidcClaims + request.actorSub
    │ upserts user row (fire-and-forget)
    ▼
Route handler (routes/tickets.ts)
    │ validates input, extracts params
    ▼
Repository (repositories/ticketRepository.ts)
    │ Prisma query
    │ auditRepository.record() — before/after snapshot
    ▼
MariaDB
    │
    ▼
JSON response
```

---

## Authentication

Authentication is fully delegated to an OIDC-compliant identity provider. No passwords are stored in materialticket's database.

Supported providers (same code, different `OIDC_ISSUER_URL`):
- **Azure AD** — `https://login.microsoftonline.com/<tenant>/v2.0`
- **Authentik** — `https://authentik.host/application/o/<slug>/`
- Any other OIDC-compliant IdP

The backend uses `openid-client` to validate bearer tokens via introspection or the userinfo endpoint. On first auth, a row is inserted into `users` and updated on each subsequent request (`last_seen_at`).

---

## Frontend data flow

```
App.tsx
  fetchTickets()   ─► GET /api/tickets    ─► ticketRepo.list()
  handleStatusChange() ─► PATCH /api/tickets/:id  ─► ticketRepo.update()
  fetchTicketNotes() ─► GET /api/tickets/:id/notes ─► noteRepo.listForTicket()

api/client.ts — all fetch() calls go through here
  - injects Authorization: Bearer <token> header
  - consistent error handling
  - single place to add retry logic later
```

---

## What's planned but not yet built

| Phase | Feature | Status |
|---|---|---|
| Phase 3 | Sync service (background job, scheduled runs) | Planned |
| Phase 3 | CWManageView wired to sync endpoints | Planned |
| Phase 4 | IMAP provider (email-to-ticket) | Planned |
| Phase 5 | ScriptRunner interface + MeshCentral/TacticalRMM | Planned |
| - | CreateTicketDialog (UI) | Planned |
| - | TicketHistory component (UI) | Planned |
| - | Full OIDC login flow on frontend | Planned |
