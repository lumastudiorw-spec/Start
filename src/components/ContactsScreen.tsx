import { useState } from 'react'
import type { Contact } from '../types'

interface Props {
  contacts: Contact[]
  onChange: (contacts: Contact[]) => void
}

export function ContactsScreen({ contacts, onChange }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || (!phone.trim() && !email.trim())) return
    onChange([
      ...contacts,
      { id: crypto.randomUUID(), name: name.trim(), phone: phone.trim(), email: email.trim() },
    ])
    setName('')
    setPhone('')
    setEmail('')
  }

  const remove = (id: string) => {
    onChange(contacts.filter((c) => c.id !== id))
  }

  return (
    <div className="screen">
      <h1>Trusted contacts</h1>
      <p className="hint">
        Stored only on this device until the moment you send an alert. Phone is used for the
        one-tap share/SMS; email is used by the backend relay for the queued alert that keeps
        trying until it gets through.
      </p>

      <form className="contact-form" onSubmit={add}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Contact name"
        />
        <input
          type="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-label="Contact phone number"
        />
        <input
          type="email"
          placeholder="Email (for the queued/retry alert)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Contact email"
        />
        <button className="btn" type="submit">
          Add contact
        </button>
      </form>

      <ul className="contact-list">
        {contacts.map((c) => (
          <li key={c.id}>
            <div>
              <strong>{c.name}</strong>
              <div className="hint">
                {[c.phone, c.email].filter(Boolean).join(' · ') || 'no phone or email'}
              </div>
            </div>
            <button className="btn btn-outline btn-small" onClick={() => remove(c.id)}>
              Remove
            </button>
          </li>
        ))}
        {contacts.length === 0 && <li className="hint">No contacts yet.</li>}
      </ul>
    </div>
  )
}
