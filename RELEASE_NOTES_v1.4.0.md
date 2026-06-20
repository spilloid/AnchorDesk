# AnchorDesk v1.4.0 — Companies, Contacts, and time tracking

AnchorDesk grows a CRM spine. Tickets now belong to real **companies** and the
**people** at them, every company gets its own page, and **time tracking** is
finally first-class — quick to log, easy to total.

## Highlights

- **🏢 Companies are real records.** A `Company` table with name, domain, phone,
  email, website, address, and notes — created and edited from the new
  **Companies** view. Tickets and devices keep a denormalized `companyName`
  (so sync and back-compat are unaffected) while linking to the company by id.
- **👥 Contacts.** Each company has contacts (name, title, email, phone, primary
  flag). Tickets can name the **contact** they're for, and contacts are managed
  right on the company page.
- **📇 Company page.** One place per company: editable details, contacts, **all of
  its tickets** (click through to the ticket), its **devices**, and a running
  **time total**.
- **⏱️ Time tracking that feels good.** Log time on a ticket with one tap
  (+15m / +30m / +1h / +2h) or a custom amount with a note. Totals roll up per
  ticket and per company, entries land on the activity timeline, and every entry
  is actor-attributed in the audit log.
- **🔗 Pickers everywhere.** Create- and edit-ticket both have a company
  autocomplete (type a new name to create it on the spot) and a contact picker
  scoped to the chosen company — alongside the technician assignee picker.

## Under the hood

- New `companies` + `contacts` tables; `tickets.company_id`/`contact_id` and
  `devices.company_id` foreign keys; `notes.minutes` for durations.
- New API: `/companies` (+ `/:id/tickets`, `/:id/devices`, `/:id/time`),
  `/companies/:id/contacts`, `/contacts/:id`, and ticket `/:id/time`
  (log + total). Company name edits propagate to denormalized ticket/device names.

## Notes

- Stack: React + MUI · Fastify + TypeScript · Prisma · PostgreSQL
- Images: `ghcr.io/spilloid/anchordesk-backend:1.4.0`, `ghcr.io/spilloid/anchordesk-web-client:1.4.0`
- License: MIT
