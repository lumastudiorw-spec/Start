import type { HistoryEntry } from '../types'

interface Props {
  history: HistoryEntry[]
  onClear: () => void
}

export function HistoryScreen({ history, onClear }: Props) {
  return (
    <div className="screen">
      <h1>Alert history</h1>
      <p className="hint">Stored only on this device. Nobody else can see this log.</p>

      {history.length > 0 && (
        <button className="btn btn-outline btn-small" onClick={onClear}>
          Clear history
        </button>
      )}

      <ul className="history-list">
        {history.map((h) => (
          <li key={h.id}>
            <strong>{new Date(h.timestamp).toLocaleString()}</strong>
            <div className="hint">
              {h.outcome === 'sent' ? 'Delivered' : h.outcome === 'queued' ? 'Was queued, retrying' : 'Cancelled'} ·{' '}
              {h.contactCount} contact{h.contactCount === 1 ? '' : 's'} ·{' '}
              {h.latitude != null ? `location included (±${Math.round(h.accuracy ?? 0)}m)` : 'no location'}
            </div>
          </li>
        ))}
        {history.length === 0 && <li className="hint">No alerts sent yet.</li>}
      </ul>
    </div>
  )
}
