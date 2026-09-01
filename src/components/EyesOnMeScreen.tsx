import { useEffect, useRef, useState } from 'react'
import { sendAlert } from '../lib/api'
import { buildMessage, dispatchAlert } from '../lib/alert'
import { registerBackgroundSync } from '../lib/flush'
import { getBestFix, useLocation } from '../lib/geolocation'
import { enqueueAlert, removePendingAlert, type QueuedAlert } from '../lib/outbox'
import { appendHistory } from '../lib/storage'
import type { Contact, HistoryEntry, Settings } from '../types'

type Phase = 'idle' | 'armed' | 'sent'

interface Props {
  contacts: Contact[]
  settings: Settings
  onNeedsContacts: () => void
}

export function EyesOnMeScreen({ contacts, settings, onNeedsContacts }: Props) {
  const { fix, permission } = useLocation()
  const [phase, setPhase] = useState<Phase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(settings.countdownSeconds)
  const [lastEntry, setLastEntry] = useState<HistoryEntry | null>(null)
  const [lastMessage, setLastMessage] = useState('')
  const [delivered, setDelivered] = useState(false)
  const timerRef = useRef<number | null>(null)
  const secondsRef = useRef(settings.countdownSeconds)

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
    setLastMessage(message)

    const queued: QueuedAlert = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      message,
      latitude: usedFix?.latitude ?? null,
      longitude: usedFix?.longitude ?? null,
      accuracy: usedFix?.accuracy ?? null,
      contacts: contacts.filter((c) => c.email).map((c) => ({ name: c.name, email: c.email })),
    }

    // Queue first, no matter what — this is the record that survives no
    // signal, even if the immediate send below succeeds and clears it.
    await enqueueAlert(queued)

    let sentNow = false
    if (queued.contacts.length > 0) {
      sentNow = await sendAlert(queued)
      if (sentNow) await removePendingAlert(queued.id)
    }
    if (!sentNow) {
      void registerBackgroundSync()
    }

    const entry: HistoryEntry = {
      id: queued.id,
      timestamp: queued.createdAt,
      outcome: sentNow ? 'sent' : 'queued',
      latitude: queued.latitude,
      longitude: queued.longitude,
      accuracy: queued.accuracy,
      contactCount: contacts.length,
    }
    appendHistory(entry)
    setLastEntry(entry)
    setDelivered(sentNow)
    setPhase('sent')
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
    secondsRef.current = settings.countdownSeconds
    setSecondsLeft(settings.countdownSeconds)
    setPhase('armed')
    timerRef.current = window.setInterval(() => {
      // Side effects (fire, a network call) must live in this callback body,
      // not inside a setState updater — React (StrictMode in particular)
      // can invoke an updater function more than once per tick, which would
      // otherwise fire the alert twice.
      secondsRef.current -= 1
      if (navigator.vibrate) navigator.vibrate(30)
      setSecondsLeft(Math.max(secondsRef.current, 0))
      if (secondsRef.current <= 0) {
        clearTimer()
        void fire()
      }
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

  const shareManually = () => {
    void dispatchAlert(contacts, lastMessage)
  }

  if (phase === 'sent') {
    return (
      <div className="screen sos-screen">
        <div className="sent-panel">
          <h1>{delivered ? 'Someone knows' : "Queued — sending as soon as it can"}</h1>
          <p>
            {delivered
              ? `Delivered to ${lastEntry?.contactCount ?? 0} contact${lastEntry?.contactCount === 1 ? '' : 's'} with ${lastEntry?.latitude != null ? 'your location' : 'no location fix'}.`
              : "No signal right now — it's saved on this device and will send itself the moment signal comes back, even if you close the app."}
          </p>
          {!delivered && (
            <p className="hint">
              This only works while the phone has power. It can't send from a phone that's been
              turned off.
            </p>
          )}
          <div className="button-row">
            <button className="btn btn-outline" onClick={shareManually}>
              Also share via SMS/WhatsApp now
            </button>
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
        aria-label={phase === 'armed' ? 'Cancel alert' : 'Trigger Eyes on Me'}
      >
        {phase === 'armed' ? (
          <>
            <span className="sos-count">{secondsLeft}</span>
            <span className="sos-sub">tap to cancel</span>
          </>
        ) : (
          <>
            <span className="sos-main">EYES
              <br />ON ME</span>
            <span className="sos-sub">tap so someone's watching</span>
          </>
        )}
      </button>

      {contacts.length === 0 && (
        <p className="hint">
          No trusted contacts yet — <button className="link" onClick={onNeedsContacts}>add one</button> so
          this has somewhere to send the alert.
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
