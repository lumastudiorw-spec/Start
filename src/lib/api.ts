import type { QueuedAlert } from './outbox'

// Set VITE_API_BASE_URL at build time to point at your deployed backend
// (see server/README.md). Falls back to same-origin /api in dev when the
// backend is proxied, or localhost:8787 for standalone local dev.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

export async function sendAlert(alert: QueuedAlert, signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
      signal,
    })
    return res.ok
  } catch {
    return false
  }
}

export interface DiscomfortReport {
  latitude: number
  longitude: number
  category: string
  note?: string
}

export async function reportDiscomfort(report: DiscomfortReport): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/discomfort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    })
    return res.ok
  } catch {
    return false
  }
}

export interface HeatmapCell {
  latitude: number
  longitude: number
  count: number
}

export async function fetchHeatmap(): Promise<HeatmapCell[]> {
  try {
    const res = await fetch(`${API_BASE}/api/discomfort/heatmap`)
    if (!res.ok) return []
    return (await res.json()) as HeatmapCell[]
  } catch {
    return []
  }
}
