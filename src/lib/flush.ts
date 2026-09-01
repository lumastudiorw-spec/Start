import { sendAlert } from './api'
import { listPendingAlerts, removePendingAlert } from './outbox'

/** Retries every queued alert. Call on app load and on the 'online' event. */
export async function flushPendingAlerts(): Promise<void> {
  const pending = await listPendingAlerts()
  for (const alert of pending) {
    const ok = await sendAlert(alert)
    if (ok) await removePendingAlert(alert.id)
  }
}

/** Best-effort: ask the browser to wake the service worker once connectivity
 *  returns, even if this tab is closed by then. No-op where unsupported
 *  (Safari/Firefox) — the foreground flush above still covers those. */
export async function registerBackgroundSync(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready
    const syncReg = reg as ServiceWorkerRegistration & {
      sync?: { register(tag: string): Promise<void> }
    }
    await syncReg.sync?.register('flush-pending-alerts')
  } catch {
    // Background Sync unsupported or registration failed — fine, the
    // foreground online-event flush is the fallback for this browser.
  }
}
