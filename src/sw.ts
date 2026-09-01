/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { listPendingAlerts, removePendingAlert } from './lib/outbox'

declare let self: ServiceWorkerGlobalScope

// App shell only — precache never includes contacts/location/history,
// those never leave IndexedDB/localStorage except in the POST below.
precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

const API_BASE = self.location.origin.includes('localhost')
  ? 'http://localhost:8787'
  : self.location.origin

async function flushPendingAlerts(): Promise<void> {
  const pending = await listPendingAlerts()
  for (const alert of pending) {
    try {
      const res = await fetch(`${API_BASE}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      })
      if (res.ok) await removePendingAlert(alert.id)
    } catch {
      // Still offline — leave it queued, the next sync/online event retries it.
    }
  }
}

// Background Sync: the browser wakes this worker the moment it detects
// connectivity again, even if the app itself isn't open (Chromium/Android
// only — Safari/Firefox don't implement this API, see README).
self.addEventListener('sync', (event) => {
  const syncEvent = event as unknown as { tag: string; waitUntil: (p: Promise<unknown>) => void }
  if (syncEvent.tag === 'flush-pending-alerts') {
    syncEvent.waitUntil(flushPendingAlerts())
  }
})
