# AnchorDesk v1.3.0 — UX polish, correctness, and a real toolbar

A focused quality release: it makes the ticketing experience consistent and
pleasant, fixes a class of "it doesn't actually update" papercuts, and tightens
the navigation, search, and network views.

## Highlights

- **🔤 One ticket vocabulary.** Statuses and priorities were defined three
  different ways (create dialog, Kanban board, and the ticket modal) — so a
  ticket set to "Assigned" never appeared on the board and priorities disagreed
  (labels vs `1–6`). There's now a single shared vocabulary used everywhere.
- **🧰 Redesigned view toolbar.** The row of identical buttons is replaced with a
  segmented control for Cards / Table / Board, an inline **full-text search**
  box (the Postgres search that previously had no UI), a filter action, and a
  single primary "New ticket". It only shows on ticket views now.
- **💾 Ticket edits actually stick.** Editing status/priority/assignee/etc. in the
  modal now refreshes the underlying list and shows a save confirmation —
  previously the change saved but the board/cards behind kept the old value.
- **👤 Technician + device pickers on tickets.** Assignee is a picker of real
  admins/technicians (not free text), and you can link/unlink devices to a
  ticket directly from the modal.
- **🧭 Navigation drawer pass.** The hamburger menu is themed and grouped
  (Tickets / Operations / Administration) with a brand header and a clear
  selected state.
- **🕸️ Network view that's actually clickable.** Bigger nodes with labels,
  generous hit targets, and hover/selection rings — plus the detail panel now
  shows the **tickets linked to a device** (and the ticket modal already lists a
  device's affiliated cases).

## Fixes

- Body-less and empty-`Content-Type: application/json` requests no longer 500.
- k8s manifests reference the correct published images (`anchordesk-web-client`,
  `:latest`) instead of a non-existent `:dev` tag.
- Create-ticket errors render as a proper alert; removed leftover template cruft.

## Notes

- Stack: React + MUI · Fastify + TypeScript · Prisma · PostgreSQL
- Images: `ghcr.io/spilloid/anchordesk-backend:1.3.0`, `ghcr.io/spilloid/anchordesk-web-client:1.3.0`
- License: MIT
- Next up (1.4.0): a real Company/Contact model, company ticket + network views, and time tracking.
