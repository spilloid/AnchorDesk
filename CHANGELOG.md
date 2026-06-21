# Changelog

## 1.9.0 — 2026-06-21

### Added

- Configurable public ticket-number sequence and UI display across all ticket surfaces.
- Subject-based email threading fallback using `[#NNNNN]`.
- Sync provider create/delete management and reusable sync badges.
- Live Tactical RMM device details on ticket open.
- SOPS-managed integration deployment secrets.

### Changed

- Widened Message-ID-bearing columns to `varchar(255)`.
- Clamped bounded ticket, note, and IMAP values before database writes.
- Ticket exports now use public ticket numbers.
- Local Compose applies the Prisma schema before backend startup.

### Fixed

- Invalid ticket/note route IDs now return HTTP 400 instead of passing `NaN` to Prisma.
- Web container health checks now use IPv4 loopback.

See [RELEASE_NOTES_v1.9.0.md](RELEASE_NOTES_v1.9.0.md) for the full release notes.
