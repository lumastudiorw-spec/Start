# Eyes on Me

A personal safety app built to fix the recurring flaws found in existing
"women's safety" apps (Hollie Guard, bSafe, SafeUP, ePowar, WalkSafe, and
others) — see the comparison table below. One tap sends your location to
trusted contacts and keeps trying until it gets through, even across a dead
zone; a second, opt-in feature crowdsources where people feel unsafe into a
shared map.

This is two parts:

- **`/`** (this directory) — the installable PWA client. Vite + React + TypeScript.
- **`server/`** — a minimal backend (Express + SQLite + email relay) that
  makes silent retried delivery and the shared map possible. See `server/README.md`.

## What it actually does

1. **Eyes on Me tab** (home screen): tap the button, watch a cancelable
   countdown, and on fire the alert is queued on-device (IndexedDB) and
   POSTed to the backend immediately. If that fails — no signal — it stays
   queued and the browser's Background Sync API (or a foreground retry on
   next launch/reconnect) sends it the moment connectivity returns, with no
   further tap needed. A secondary "share via SMS/WhatsApp now" button is
   available if you also want the more visible native share-sheet path.
2. **Map tab**: an anonymous, crowdsourced "where people feel unsafe"
   heatmap (Leaflet + OpenStreetMap, no API key needed). A location only
   appears once at least 3 people have reported nearby.
3. **Contacts tab**: add/remove who an alert goes to — phone (for the
   manual SMS/share path) and email (for the backend relay path).
4. **History tab**: a local-only log of alerts you've triggered.
5. **Settings tab**: countdown length, message template, local emergency number.
6. **Privacy tab**: exactly what stays on-device, what reaches the server
   and when, and the honest limitations (see below).

## Fixing the flaws in existing apps

| Flaw in existing apps | What this app does instead |
| --- | --- |
| Third-party trackers/ad SDKs sell location data | Zero analytics/ad SDKs anywhere in the client. The only network calls are the ones described in the Privacy tab. |
| Hollie Guard locks users out unless kept open; the panic trigger needs login first | No login, ever — the app opens straight to the trigger. |
| Cold GPS fix is too slow to be useful in an emergency | `watchPosition` starts the moment the app loads, so a fix is already cached by the time the button is tapped. |
| An alert silently fails in a dead zone and nobody finds out | The alert is queued on-device and retried automatically (Background Sync / reconnect) until it actually sends — not "fire and hope." |
| Multi-step activation doesn't match impaired fine motor control under panic | One tap arms it; nothing else stands between tap and send except an optional, configurable countdown to catch accidental taps. |
| Shake-to-trigger causes false positives | Not used — trigger is an explicit tap, not a motion heuristic. |
| Opaque data retention | Documented per-field in the Privacy tab and `server/README.md`; the server keeps the least data it can while still doing its job. |
| Crime-stat heatmaps (WalkSafe-style) risk reflecting policing bias, not real risk | This map is self-reported "I felt unsafe here," not police crime data, and is k-anonymized (3+ reports) before it's shown. |

## Known, honest limitations

- **A powered-off phone can't do anything.** No app, native or web, runs
  code without power — "keeps trying until signal returns" covers dead
  zones and being offline, not a phone that's off.
- Background Sync (retry-while-app-is-closed) is Chromium/Android only —
  Safari/Firefox retry on next app open instead. Still automatic, just not
  while fully backgrounded on those browsers.
- No delivery confirmation beyond "the server accepted it."
- No crowdsourced responder network or direct 911/112 dispatch integration.

## Development

Client:
```bash
npm install
npm run dev      # local dev server
npm run build    # production build + service worker
npm run lint      # oxlint
```

Set `VITE_API_BASE_URL` (e.g. in `.env.local`) to point the client at your
backend — defaults to `http://localhost:8787` for local dev.

Backend: see `server/README.md`.
