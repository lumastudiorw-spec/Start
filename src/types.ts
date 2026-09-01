export interface Contact {
  id: string
  name: string
  phone: string
}

export interface Settings {
  /** Seconds the SOS button stays cancelable before the alert fires. 0 = instant. */
  countdownSeconds: number
  /** Message template. Supports {name}, {time}, {location} placeholders. */
  messageTemplate: string
  /** Local emergency services number, user-configured (varies by country). */
  emergencyNumber: string
}

export type AlertOutcome = 'sent' | 'cancelled'

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
