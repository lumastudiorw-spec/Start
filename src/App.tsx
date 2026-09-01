import { useEffect, useState } from 'react'
import { BottomNav, type Tab } from './components/BottomNav'
import { ContactsScreen } from './components/ContactsScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { PrivacyScreen } from './components/PrivacyScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { SosScreen } from './components/SosScreen'
import {
  clearHistory,
  eraseAllData,
  loadContacts,
  loadHistory,
  loadSettings,
  saveContacts,
  saveSettings,
} from './lib/storage'
import type { Contact, HistoryEntry, Settings } from './types'

function initialTab(): Tab {
  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab')
  if (tab === 'sos' || tab === 'contacts' || tab === 'history' || tab === 'settings' || tab === 'privacy') {
    return tab
  }
  return 'sos'
}

export default function App() {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [contacts, setContacts] = useState<Contact[]>(() => loadContacts())
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())

  useEffect(() => saveContacts(contacts), [contacts])
  useEffect(() => saveSettings(settings), [settings])

  return (
    <div className="app">
      <main className="app-main">
        {tab === 'sos' && (
          <SosScreen
            contacts={contacts}
            settings={settings}
            onNeedsContacts={() => setTab('contacts')}
          />
        )}
        {tab === 'contacts' && <ContactsScreen contacts={contacts} onChange={setContacts} />}
        {tab === 'history' && (
          <HistoryScreen
            history={history}
            onClear={() => {
              clearHistory()
              setHistory([])
            }}
          />
        )}
        {tab === 'settings' && (
          <SettingsScreen
            settings={settings}
            onChange={setSettings}
            onEraseAll={() => {
              eraseAllData()
              setContacts([])
              setSettings(loadSettings())
              setHistory([])
            }}
          />
        )}
        {tab === 'privacy' && <PrivacyScreen />}
      </main>
      <BottomNav active={tab} onSelect={setTab} />
    </div>
  )
}
