export type Tab = 'alert' | 'map' | 'contacts' | 'history' | 'settings' | 'privacy'

const TABS: { id: Tab; label: string }[] = [
  { id: 'alert', label: 'Alert' },
  { id: 'map', label: 'Map' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
  { id: 'privacy', label: 'Privacy' },
]

interface Props {
  active: Tab
  onSelect: (tab: Tab) => void
}

export function BottomNav({ active, onSelect }: Props) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`nav-item ${active === t.id ? 'active' : ''}`}
          onClick={() => onSelect(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
