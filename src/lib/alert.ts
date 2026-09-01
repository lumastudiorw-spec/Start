import type { Fix } from './geolocation'
import type { Contact, Settings } from '../types'

export function buildMessage(template: string, fix: Fix | null): string {
  const location = fix
    ? `https://maps.google.com/?q=${fix.latitude},${fix.longitude} (±${Math.round(fix.accuracy)}m)`
    : 'location unavailable'
  const time = new Date().toLocaleString()
  return template.replaceAll('{location}', location).replaceAll('{time}', time)
}

export interface DispatchResult {
  method: 'share' | 'sms' | 'none'
}

/**
 * Browsers deliberately do not let a web page send an SMS or make a call
 * without the user tapping "send" in their own SMS/share app — that final
 * tap can't be automated from here. What we *can* do is get the user to
 * that final tap in one motion: a single share sheet pre-addressed to every
 * contact, or an sms: link that opens the native app with everything typed
 * in already.
 */
export async function dispatchAlert(contacts: Contact[], message: string): Promise<DispatchResult> {
  if (contacts.length === 0) return { method: 'none' }

  if (navigator.share) {
    try {
      await navigator.share({ text: message, title: 'SOS alert' })
      return { method: 'share' }
    } catch {
      // User cancelled the share sheet or it failed — fall through to sms:.
    }
  }

  const numbers = contacts.map((c) => c.phone).join(',')
  const body = encodeURIComponent(message)
  // iOS uses `&`, most Android sms: implementations use `?body=` too — this
  // is the widely-supported form.
  window.location.href = `sms:${numbers}?body=${body}`
  return { method: 'sms' }
}

export function buildSettingsPreview(settings: Settings, fix: Fix | null): string {
  return buildMessage(settings.messageTemplate, fix)
}
