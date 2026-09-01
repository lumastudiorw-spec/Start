import { useEffect, useState } from 'react'
import { BottomNav, type Tab } from './components/BottomNav'
import { ContactsScreen } from './components/ContactsScreen'
import { EyesOnMeScreen } from './components/EyesOnMeScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { MapScreen } from './components/MapScreen'
import { PrivacyScreen } from './components/PrivacyScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { flushPendingAlerts } from './lib/flush'
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

const VALID_TABS: Tab[] = ['alert', 'map', 'contacts', 'history', 'settings', 'privacy']

function initialTab(): Tab {
  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab')
  return (VALID_TABS as string[]).includes(tab ?? '') ? (tab as Tab) : 'alert'
}

export default function App() {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [contacts, setContacts] = useState<Contact[]>(() => loadContacts())
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())

  useEffect(() => saveContacts(contacts), [contacts])
  useEffect(() => saveSettings(settings), [settings])

  useEffect(() => {
    void flushPendingAlerts()
    const onOnline = () => void flushPendingAlerts()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return (
    <div className="app">
      <main className="app-main">
        {tab === 'alert' && (
          <EyesOnMeScreen
            contacts={contacts}
            settings={settings}
            onNeedsContacts={() => setTab('contacts')}
          />
        )}
        {tab === 'map' && <MapScreen />}
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
