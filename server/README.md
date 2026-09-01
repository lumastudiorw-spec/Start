# Eyes on Me — server

The minimal backend that makes two things possible that the client alone
can't do:

1. **Silent, retried delivery.** The client queues every alert locally
   (IndexedDB) and POSTs it here immediately. If that fails (no signal),
   the browser's Background Sync API (or a foreground retry on next launch/
   reconnect) POSTs it again later — no user interaction required, unlike
   the share-sheet/SMS path.
2. **The shared discomfort map.** Individual reports are meaningless
   without aggregating across users, which needs a shared store.

## What it stores, and why that's the whole list

- `alerts`: id, timestamp, rounded location, contact count, delivered
  flag. **Not stored:** the message text or any contact's name/email —
  those exist only for the moment it takes to send the email, then they're
  gone. This table exists so an alert's rough last-known location can be
  reconstructed later if needed — nothing more.
- `discomfort_reports`: id, timestamp, location (rounded to ~111m), a
  category, an optional note. No device or user identifier is ever
  accepted, so a report can never be traced back to a person by this
  server, even by its own operator.
- The public heatmap endpoint only returns a grid cell once at least 3
  people have reported in it (`MIN_CELL_COUNT` in `src/index.ts`) — a
  single report is never independently visible.

## Running it

```bash
npm install
cp .env.example .env   # fill in SMTP_* to actually send email; optional for local dev
npm run dev             # http://localhost:8787
```

Requires Node ≥ 22.5 (uses the built-in `node:sqlite`, currently
experimental — you'll see one warning on startup, that's expected).

Point the frontend at this server by setting `VITE_API_BASE_URL` when you
build/run the client (see the root README).

## Deploying

It's a single stateless-ish Express process plus a SQLite file — it runs
anywhere that runs Node: Fly.io, Render, a small VPS, a Docker container.
Persist `DB_PATH`'s directory as a volume if you deploy somewhere with an
ephemeral filesystem. Set `ALLOWED_ORIGIN` to your deployed frontend's
origin (not `*`) once this is live.

## Known limitations

- Single-instance rate limiting (in-memory) — fine at small scale, would
  need a shared store (Redis, etc.) to survive multiple server instances.
- No email deliverability hardening (SPF/DKIM/DMARC) configured here —
  that's on whichever SMTP provider you point `SMTP_HOST` at.
- `node:sqlite` is an experimental Node API; if it's ever removed, swap
  `src/db.ts` for `better-sqlite3` — that's the only file touching it.
