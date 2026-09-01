// IndexedDB-backed queue for pending alerts. Deliberately not localStorage:
// a service worker (which is what retries this in the background, even
// while the app is closed) cannot see localStorage at all — IndexedDB is
// the only storage both contexts can share.

export interface QueuedAlert {
  id: string
  createdAt: number
  message: string
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  contacts: { name: string; email: string }[]
}

const DB_NAME = 'eyes-on-me-outbox'
const STORE = 'pending-alerts'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueueAlert(alert: QueuedAlert): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(alert)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function listPendingAlerts(): Promise<QueuedAlert[]> {
  const db = await openDb()
  const result = await new Promise<QueuedAlert[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result as QueuedAlert[])
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result
}

export async function removePendingAlert(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
