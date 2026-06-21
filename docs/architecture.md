# Architecture

## Overview

anchordesk is a local-first ticketing system. The PostgreSQL database is the source of truth. External platforms (ConnectWise, IMAP, etc.) are sync adapters that feed into the local store — they are not the core.

```
┌──────────────────────────────────────────────────────────────┐
│                        anchordesk                        │
│                                                              │
│  ┌─────────────────┐        ┌─────────────────────────────┐ │
│  │  React + MUI    │ /api/* │  Fastify (Node.js + TS)     │ │
│  │  web-client     │───────►│  backend :8060               │ │
│  └─────────────────┘        └───────────┬─────────────────┘ │
│                                         │ Prisma ORM         │
│                                         ▼                    │
│                              ┌─────────────────────┐        │
│                              │  PostgreSQL :5432    │        │
│                              │  (source of truth)   │        │
│                              └──────────┬──────────┘        │
│                                         │                    │
│              ┌──────────────────────────┼─────────────────┐ │
│              │      Integration adapters & pollers         │ │
│              │  ┌────────────────┐  ┌───┴───────────────┐ │ │
│              │  │ConnectWise     │  │ IMAP / SMTP       │ │ │
│              │  │Provider        │  │ mail services     │ │ │
│              │  └────────────────┘  └───────────────────┘ │ │
│              └─────────────────────────────────────────────┘ │
│                                                              │
│                  ┌──────────────────────────────────────┐   │
│                  │     Device providers & RMM runners    │   │
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
└── YourProvider           implements TicketProvider (add yours)

DeviceProvider (interface)
├── NetVizProvider         implements DeviceProvider
└── TacticalRmmProvider    implements DeviceProvider

ScriptRunner (interface)
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

### Factory — provider instantiation

The sync service instantiates providers from the `sync_providers` table using a
factory function. The factory reads `type` from the row and returns the correct
`TicketProvider` implementation. Provider instances are managed through the Sync
view and `/sync/providers` routes.

---

## Request lifecycle

```
HTTP request
    │
    ▼
Fastify onRequest hook
    │ auth.ts — resolves session cookie OR OIDC bearer token
    │ sets request.user (with role) + request.actorSub
    │ enforces baseline RBAC (readonly cannot mutate)
    ▼
Route handler (routes/tickets.ts)
    │ optional requireRole('admin') preHandler
    │ validates input, extracts params
    ▼
Repository (repositories/ticketRepository.ts)
    │ Prisma query
    │ auditRepository.record() — before/after snapshot
    ▼
PostgreSQL
    │
    ▼
JSON response
```

---

## Authentication & authorization

As of 1.1.0, three auth methods run side by side; an admin enables any combination
from **Admin → Authentication** (env vars seed the initial config on first boot).

- **Local accounts** — bcrypt password hashes, server-side sessions (opaque cookie
  token; only its SHA-256 hash is stored, so sessions are revocable). **TOTP MFA is
  on by default**: local users enroll an authenticator (QR) before first access and
  get one-time recovery codes.
- **OIDC** — interactive authorization-code login (PKCE + state + nonce) via
  `openid-client`, plus bearer-token validation for API clients. Works with Azure AD
  (`https://login.microsoftonline.com/<tenant>/v2.0`), Authentik
  (`https://authentik.host/application/o/<slug>/`), Okta, or any OIDC IdP.
- **SAML 2.0** — `@node-saml/node-saml` SP: AuthnRequest redirect, signed-assertion
  validation at the ACS endpoint, and SP metadata at `/auth/saml/metadata`.

All three culminate in a local session. **RBAC** is enforced on every request:
`readonly` can only read, `technician` can mutate tickets/devices, and admin-only
surfaces (users, auth settings, probes, sync) require the `admin` role. Set
`OIDC_DISABLED=true` to bypass auth entirely in local dev.

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

## Delivery status

| Phase | Feature | Status |
|---|---|---|
| 1.1.0 | Local accounts + OIDC + SAML login, sessions, RBAC | **Done** |
| 1.1.0 | TOTP MFA (on by default) + recovery codes | **Done** |
| 1.1.0 | PostgreSQL migration + full-text ticket search | **Done** |
| 1.1.0 | Network view (NetViz radial map over devices) | **Done** |
| 1.6.0 | IMAP email-to-ticket + SMTP ticket replies | **Done** |
| 1.7.0 | Attachments, WebSockets, notifications, SLA | **Done** |
| 1.8.0 | Multi-identity email, labels, export, fuzzy search | **Done** |
| 1.9.0 | Public ticket numbers, subject threading fallback, sync management, live Tactical panel | **Done** |
| Roadmap | Postgres LISTEN/NOTIFY for live probe status | Planned |
