# AnchorDesk v1.5.1 — polish

A round of fixes from real-world use.

## Fixes

- **Kanban drag-and-drop works again.** Swapped the unmaintained
  `react-beautiful-dnd` (broken under React 18) for `@hello-pangea/dnd`, and the
  ticket card is no longer a `<button>` that swallowed the drag. Columns are
  themed, show counts, and highlight on drag-over.
- **Usable network map.** Devices now fan out across concentric rings on a larger
  canvas instead of piling into the center; node labels appear on hover/selection
  (no more overlap), with generous click targets.
- **Priority defaults to Medium** everywhere — never blank/"unassigned" — and the
  old `P1`-style label is gone in favor of Low / Medium / High / Critical chips.
- **Add a contact inline** from the ticket modal (type a name, Add) without
  leaving for the company page.
- **Tactical vs NetViz is obvious.** Device source chips (NetViz / Tactical /
  Manual) show in the device-link picker and on linked devices.
- Timeline notes use theme colors; time entries read clearly.

## Notes

- Images: `ghcr.io/spilloid/anchordesk-backend:1.5.1`, `ghcr.io/spilloid/anchordesk-web-client:1.5.1`
- License: MIT
