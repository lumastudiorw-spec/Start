import { DEFAULT_SETTINGS, type Contact, type HistoryEntry, type Settings } from '../types'

// Everything here is local-only (localStorage). Nothing in this file ever
// makes a network request — that is the whole privacy model of this app.

const KEYS = {
  contacts: 'guardian.contacts.v1',
  settings: 'guardian.settings.v1',
  history: 'guardian.history.v1',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable (private browsing) — fail silently,
    // the app still works, it just won't persist between sessions.
  }
}

export function loadContacts(): Contact[] {
  return read<Contact[]>(KEYS.contacts, [])
}

export function saveContacts(contacts: Contact[]): void {
  write(KEYS.contacts, contacts)
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) }
}

export function saveSettings(settings: Settings): void {
  write(KEYS.settings, settings)
}

export function loadHistory(): HistoryEntry[] {
  return read<HistoryEntry[]>(KEYS.history, [])
}

export function saveHistory(history: HistoryEntry[]): void {
  write(KEYS.history, history)
}

export function appendHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...loadHistory()].slice(0, 200)
  saveHistory(next)
  return next
}

export function clearHistory(): void {
  saveHistory([])
}

export function eraseAllData(): void {
  localStorage.removeItem(KEYS.contacts)
  localStorage.removeItem(KEYS.settings)
  localStorage.removeItem(KEYS.history)
}
