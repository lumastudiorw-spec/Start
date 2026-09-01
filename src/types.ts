export interface Contact {
  id: string
  name: string
  /** Used for the one-tap share/SMS path. */
  phone: string
  /** Used by the backend relay for the queued/silent-retry path. */
  email: string
}

export interface Settings {
  /** Seconds the alert button stays cancelable before it fires. 0 = instant. */
  countdownSeconds: number
  /** Message template. Supports {name}, {time}, {location} placeholders. */
  messageTemplate: string
  /** Local emergency services number, user-configured (varies by country). */
  emergencyNumber: string
}

export type AlertOutcome = 'sent' | 'queued' | 'cancelled'

export interface HistoryEntry {
  id: string
  timestamp: number
  outcome: AlertOutcome
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  contactCount: number
}

export const DEFAULT_SETTINGS: Settings = {
  countdownSeconds: 3,
  messageTemplate:
    "I need help. This is an automated alert from my safety app. My location: {location} (sent {time}).",
  emergencyNumber: '',
}
