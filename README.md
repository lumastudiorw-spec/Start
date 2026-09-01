# Guardian — a personal safety app that doesn't sell your data

A privacy-first, installable web app (PWA) built specifically to fix the
recurring flaws found in existing "women's safety" apps (Hollie Guard,
bSafe, SafeUP, ePowar, WalkSafe, and others):

| Flaw in existing apps | What this app does instead |
| --- | --- |
| Third-party trackers/ad SDKs sell location data (documented in a forensic audit of 20 popular safety apps) | **Zero network calls.** No backend, no analytics, no ad SDK. Check `src/` — there's nothing to phone home with. |
| Hollie Guard locks users out unless the app is kept open, and the panic trigger doesn't work until you're logged in | **No login, ever.** The app opens directly to the SOS button. Nothing gates the trigger. |
| Cold GPS fix takes too long to be useful in an emergency | **Warm geolocation.** `watchPosition` starts the moment the app loads (`src/lib/geolocation.ts`), so a fix is already cached by the time SOS is tapped. |
| Multi-step activation doesn't match fine-motor/cognitive impairment under panic | One tap arms the alert; a large countdown ring with vibration feedback gives a cancel window (configurable 0–10s, default 3s) for false triggers, but nothing else stands between tap and send. |
| Shake-to-trigger causes false positives, eroding trust in real alerts | Deliberately not used. Trigger is an explicit tap, not a motion heuristic. |
| Opaque data retention, unclear what's stored or shared | `localStorage` only, plainly documented in the in-app **Privacy** tab, with a one-tap "erase everything." |

## What it actually does

1. **SOS tab** (the app's home screen): tap the button, watch the countdown,
   get a chance to cancel, and on fire it opens your device's native share
   sheet (or `sms:` link fallback) pre-addressed to your trusted contacts
   with your current location as a Google Maps link and a timestamp.
2. **Contacts tab**: add/remove the people an alert goes to. Stored locally only.
3. **History tab**: a local-only log of alerts you've sent, so you (and only you) can review them.
4. **Settings tab**: countdown length, message template, and a local emergency-services number (deliberately not auto-detected — that would require a network location lookup by default, which this app won't do).
5. **Privacy tab**: a plain-language account of exactly what the app does and does not do, plus its known limitations.

## Known limitations (stated honestly, not hidden)

- Browsers will not let a web page send an SMS or place a call without the
  user tapping "send" in their own app — this app gets you to that final
  tap in one motion (one share-sheet or pre-filled `sms:` link for every
  contact at once) but cannot automate past it. A native app could use
  platform SMS APIs to do this silently; this PWA cannot, by design of the
  web platform's abuse protections.
- Still requires GPS/network signal for a location fix and cell signal to
  actually send — no safety app can get around physics.
- No delivery confirmation. The app cannot know whether a contact actually
  received the alert.
- No crowdsourced responder network, no direct 911/112 dispatch integration
  — those require a legal/organizational relationship with emergency
  services or a verified-responder network, out of scope for a client-only
  MVP. Noted as a possible future direction, not silently promised.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build + service worker
npm run lint      # oxlint
```

Built with Vite + React + TypeScript + `vite-plugin-pwa` (installable,
offline-capable app shell — the service worker only ever caches static
assets, never contacts/location/history).
