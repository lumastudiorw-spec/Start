import express, { type Request, type Response } from 'express'
import { randomUUID } from 'node:crypto'
import { db } from './db.js'
import { sendAlertEmail } from './mailer.js'
import { isRateLimited } from './rateLimit.js'

const app = express()
app.use(express.json({ limit: '20kb' }))

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '*'
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

function clientIp(req: Request): string {
  return req.ip ?? 'unknown'
}

// --- Alerts -----------------------------------------------------------
// Stores only what's needed to know an alert happened and roughly where —
// never the message text or contact list itself, past the moment of send.

interface AlertBody {
  id?: string
  message?: string
  latitude?: number | null
  longitude?: number | null
  accuracy?: number | null
  contacts?: { name: string; email: string }[]
}

app.post('/api/alerts', async (req: Request, res: Response) => {
  if (isRateLimited(`alert:${clientIp(req)}`, 10, 60_000)) {
    res.status(429).json({ ok: false, error: 'rate limited' })
    return
  }

  const body = req.body as AlertBody
  const message = typeof body.message === 'string' ? body.message.slice(0, 2000) : ''
  const contacts = Array.isArray(body.contacts)
    ? body.contacts.filter(
        (c): c is { name: string; email: string } =>
          typeof c?.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email),
      )
    : []

  if (!message || contacts.length === 0) {
    res.status(400).json({ ok: false, error: 'message and at least one valid contact email required' })
    return
  }

  const delivered = await sendAlertEmail(contacts, message)

  db.prepare(
    `INSERT OR REPLACE INTO alerts (id, created_at, latitude, longitude, accuracy, contact_count, delivered)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    body.id ?? randomUUID(),
    Date.now(),
    body.latitude ?? null,
    body.longitude ?? null,
    body.accuracy ?? null,
    contacts.length,
    delivered ? 1 : 0,
  )

  if (!delivered) {
    res.status(502).json({ ok: false, error: 'delivery failed, will be retried by the client' })
    return
  }
  res.json({ ok: true })
})

// --- Discomfort reports -------------------------------------------------
// Fully anonymous: no device/user identifier is ever accepted or stored.

const GRID_PRECISION = 3 // ~111m per step, coarser near the poles

function roundToGrid(n: number): number {
  return Math.round(n * 10 ** GRID_PRECISION) / 10 ** GRID_PRECISION
}

interface DiscomfortBody {
  latitude?: number
  longitude?: number
  category?: string
  note?: string
}

app.post('/api/discomfort', (req: Request, res: Response) => {
  if (isRateLimited(`discomfort:${clientIp(req)}`, 20, 60 * 60_000)) {
    res.status(429).json({ ok: false, error: 'rate limited' })
    return
  }

  const body = req.body as DiscomfortBody
  const { latitude, longitude, category } = body
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    typeof category !== 'string' ||
    category.length === 0 ||
    category.length > 60
  ) {
    res.status(400).json({ ok: false, error: 'invalid report' })
    return
  }
  const note = typeof body.note === 'string' ? body.note.slice(0, 280) : null

  db.prepare(
    `INSERT INTO discomfort_reports (id, created_at, latitude, longitude, category, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), Date.now(), roundToGrid(latitude), roundToGrid(longitude), category, note)

  res.json({ ok: true })
})

// K-anonymized: a grid cell only shows up once at least MIN_CELL_COUNT
// people have reported in it, so no single report can be pinpointed.
const MIN_CELL_COUNT = 3

app.get('/api/discomfort/heatmap', (_req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT latitude, longitude, COUNT(*) as count
       FROM discomfort_reports
       GROUP BY latitude, longitude
       HAVING COUNT(*) >= ?`,
    )
    .all(MIN_CELL_COUNT)
  res.json(rows)
})

app.get('/api/discomfort/export.csv', (req: Request, res: Response) => {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '')
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken || token !== adminToken) {
    res.status(401).json({ ok: false, error: 'unauthorized' })
    return
  }
  const rows = db
    .prepare(`SELECT id, created_at, latitude, longitude, category, note FROM discomfort_reports ORDER BY created_at`)
    .all()
  const header = 'id,created_at,latitude,longitude,category,note\n'
  const csv = rows
    .map((r) =>
      [r.id, r.created_at, r.latitude, r.longitude, r.category, JSON.stringify(r.note ?? '')].join(','),
    )
    .join('\n')
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="discomfort-reports.csv"')
  res.send(header + csv)
})

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }))

const PORT = Number(process.env.PORT ?? 8787)
app.listen(PORT, () => {
  console.log(`Eyes on Me server listening on :${PORT}`)
})
