import { useEffect, useRef, useState } from 'react'
import { dispatchAlert, buildMessage } from '../lib/alert'
import { getBestFix, useLocation } from '../lib/geolocation'
import { appendHistory } from '../lib/storage'
import type { Contact, HistoryEntry, Settings } from '../types'

type Phase = 'idle' | 'armed' | 'sent'

interface Props {
  contacts: Contact[]
  settings: Settings
  onNeedsContacts: () => void
}

export function SosScreen({ contacts, settings, onNeedsContacts }: Props) {
  const { fix, permission } = useLocation()
  const [phase, setPhase] = useState<Phase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(settings.countdownSeconds)
  const [lastEntry, setLastEntry] = useState<HistoryEntry | null>(null)
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => () => clearTimer(), [])

  const fire = async () => {
    const usedFix = getBestFix() ?? fix
    const message = buildMessage(settings.messageTemplate, usedFix)
    const result = await dispatchAlert(contacts, message)
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      outcome: 'sent',
      latitude: usedFix?.latitude ?? null,
      longitude: usedFix?.longitude ?? null,
      accuracy: usedFix?.accuracy ?? null,
      contactCount: contacts.length,
    }
    appendHistory(entry)
    setLastEntry(entry)
    setPhase('sent')
    void result
  }

  const arm = () => {
    if (contacts.length === 0) {
      onNeedsContacts()
      return
    }
    if (navigator.vibrate) navigator.vibrate(80)
    if (settings.countdownSeconds <= 0) {
      void fire()
      return
    }
    setSecondsLeft(settings.countdownSeconds)
    setPhase('armed')
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (navigator.vibrate) navigator.vibrate(30)
        if (s <= 1) {
          clearTimer()
          void fire()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const cancel = () => {
    clearTimer()
    setPhase('idle')
  }

  const resetAfterSent = () => {
    setPhase('idle')
    setLastEntry(null)
  }

  if (phase === 'sent') {
    return (
      <div className="screen sos-screen">
        <div className="sent-panel">
          <h1>Alert sent</h1>
          <p>
            {lastEntry?.latitude != null
              ? `Your location was included and shared with ${lastEntry.contactCount} contact${lastEntry.contactCount === 1 ? '' : 's'}.`
              : 'Sent without a location fix — GPS was unavailable.'}
          </p>
          <p className="hint">
            If your share sheet or messaging app didn't finish sending, check it now — this app
            cannot confirm delivery on its own.
          </p>
          <div className="button-row">
            {settings.emergencyNumber && (
              <a className="btn btn-danger" href={`tel:${settings.emergencyNumber}`}>
                Call {settings.emergencyNumber}
              </a>
            )}
            <button className="btn" onClick={resetAfterSent}>
              I'm safe now
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen sos-screen">
      <div className="location-badge">
        {permission === 'denied' && 'Location off — alert will send without it'}
        {permission === 'unsupported' && 'Location not supported on this device'}
        {permission === 'unknown' && 'Getting location fix…'}
        {permission === 'granted' && fix && 'Location ready'}
        {permission === 'granted' && !fix && 'Getting location fix…'}
      </div>

      <button
        className={`sos-button ${phase === 'armed' ? 'armed' : ''}`}
        onClick={phase === 'armed' ? cancel : arm}
        aria-label={phase === 'armed' ? 'Cancel alert' : 'Send SOS alert'}
      >
        {phase === 'armed' ? (
          <>
            <span className="sos-count">{secondsLeft}</span>
            <span className="sos-sub">tap to cancel</span>
          </>
        ) : (
          <>
            <span className="sos-main">SOS</span>
            <span className="sos-sub">tap to alert</span>
          </>
        )}
      </button>

      {contacts.length === 0 && (
        <p className="hint">
          No trusted contacts yet — <button className="link" onClick={onNeedsContacts}>add one</button> so
          SOS has somewhere to send the alert.
        </p>
      )}

      {settings.emergencyNumber && (
        <a className="btn btn-outline" href={`tel:${settings.emergencyNumber}`}>
          Call emergency services ({settings.emergencyNumber})
        </a>
      )}
    </div>
  )
}
