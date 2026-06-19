# netviz ↔ MaterialTicket — integration TODO (handoff)

This is the **netviz side** of the MaterialTicket device/probe integration. MaterialTicket's
side is built and typechecks; this file is what netviz needs so the two meet in the middle on testing.

A netviz instance deployed on a customer LAN acts as a **probe**: it scans, then pushes its device
records to MaterialTicket, which upserts them into its local `Device` table and links them to tickets.

---

## The contract (v1) — MaterialTicket owns the normalizer

MaterialTicket normalizes incoming records in `backend/src/providers/NetVizProvider.ts`. The wire shape
it expects (with tolerated aliases) is:

```jsonc
{
  "id":         "stable-per-device-id",   // REQUIRED-ish: falls back to mac, then ip
  "ip":         "192.168.1.20",            // or "ipAddress"
  "hostname":   "ACME-PC-01",              // or "name"
  "mac":        "aa:bb:cc:dd:ee:ff",       // or "macAddress"
  "vendor":     "Dell",                    // or "manufacturer"
  "os":         "Windows 11",
  "deviceType": "workstation",             // or "classification"
  "openPorts":  [22, 445, 3389],           // or "ports"; objects [{port:22}] also accepted
  "status":     "up",                      // or "state"; up/down/online/offline -> normalized
  "firstSeen":  "2026-06-18T12:00:00Z",    // ISO 8601
  "lastSeen":   "2026-06-18T12:30:00Z"     // or "lastUpdated"
}
```

`NETVIZ_CONTRACT_VERSION = 1`. If netviz changes field names, either keep an alias here or bump the
version and update the normalizer in lockstep.

**TODO (netviz):** add a serializer that emits exactly this shape. netviz already has the data
(ip/host/mac/vendor/ports/classification/first-seen/last-updated) and versioned JSON export — this is a
mapping layer on top of the existing exporter, not new scanning work.

---

## Endpoints MaterialTicket already exposes

Base URL: the MaterialTicket backend (prod: `https://rmm.spillerstech.us`, dev: `http://localhost:8060`).
These two are **OIDC-exempt** (prefix `/probe/`) and authenticate with the probe's API key.

### 1. Heartbeat
```
POST /probe/heartbeat
Headers: X-Probe-Key: <apiKey>
Body (all optional): { "status": "online", "version": "1.4.0", "cidr": "192.168.1.0/24" }
```
Keeps the probe shown as "online" in the UI. Send on a timer (e.g. every 60s).

### 2. Device ingest
```
POST /probe/devices
Headers: X-Probe-Key: <apiKey>
Body: { "devices": [ <NetVizDeviceRecord>, ... ] }
Response: { "received": n, "created": n, "updated": n, "errors": [...] }
```
Push the full scan (or a delta) here after each scan completes. Upsert is keyed on
`externalId` (= record `id`/mac/ip) so re-sending the same device updates it rather than duplicating.

**The API key** is issued once when an admin registers the probe in MaterialTicket
(`POST /probes` → response includes `apiKey`, shown a single time). netviz needs a config field to store it.

---

## TODO checklist (netviz side)

- [ ] Config: `materialticket_url` + `materialticket_probe_key`.
- [ ] Serializer: scan results → `NetVizDeviceRecord[]` matching the contract above.
- [ ] Push consumer on the EventBus: on scan-complete, `POST /probe/devices`.
- [ ] Heartbeat ticker: `POST /probe/heartbeat` on an interval (carry version + cidr).
- [ ] Graceful handling of non-2xx (backoff; don't lose records — retry next cycle).
- [ ] (stretch) Live per-device status push so a ticket card can show a device up/down in near-real-time.

## Meet-in-the-middle test plan

1. MaterialTicket admin registers a probe → copy the `apiKey`.
2. Point a netviz instance at a test LAN with the URL + key.
3. Trigger a scan → confirm `POST /probe/devices` returns `created > 0`.
4. In MaterialTicket: devices appear under the probe's company; link one to a ticket; confirm "probe online".
5. Re-scan → confirm `updated > 0` (no duplicates).

---

_Generated from the MaterialTicket side at the ~75% feature mark. Keep the contract block in sync with
`backend/src/providers/NetVizProvider.ts`._
