import { buildSettingsPreview } from '../lib/alert'
import { useLocation } from '../lib/geolocation'
import type { Settings } from '../types'

interface Props {
  settings: Settings
  onChange: (settings: Settings) => void
  onEraseAll: () => void
}

export function SettingsScreen({ settings, onChange, onEraseAll }: Props) {
  const { fix } = useLocation()

  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch })

  return (
    <div className="screen">
      <h1>Settings</h1>

      <label className="field">
        <span>Countdown before sending ({settings.countdownSeconds}s)</span>
        <input
          type="range"
          min={0}
          max={10}
          value={settings.countdownSeconds}
          onChange={(e) => update({ countdownSeconds: Number(e.target.value) })}
        />
        <span className="hint">
          {settings.countdownSeconds === 0
            ? 'Instant — no cancel window. Only use this if false triggers are not a risk for you.'
            : 'Tap SOS again during the countdown to cancel a false trigger.'}
        </span>
      </label>

      <label className="field">
        <span>Alert message</span>
        <textarea
          value={settings.messageTemplate}
          onChange={(e) => update({ messageTemplate: e.target.value })}
          rows={3}
        />
        <span className="hint">Preview: {buildSettingsPreview(settings, fix)}</span>
      </label>

      <label className="field">
        <span>Local emergency number</span>
        <input
          type="tel"
          placeholder="e.g. 999, 112, 911"
          value={settings.emergencyNumber}
          onChange={(e) => update({ emergencyNumber: e.target.value })}
        />
        <span className="hint">
          This varies by country — the app can't detect it for you without a network lookup, which
          would mean sending your location somewhere by default. You set it once, here.
        </span>
      </label>

      <div className="danger-zone">
        <h2>Erase all data</h2>
        <p className="hint">Deletes contacts, settings, and alert history from this device. Cannot be undone.</p>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm('Erase all contacts, settings, and history from this device?')) onEraseAll()
          }}
        >
          Erase everything
        </button>
      </div>
    </div>
  )
}
