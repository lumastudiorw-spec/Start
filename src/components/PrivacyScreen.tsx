export function PrivacyScreen() {
  return (
    <div className="screen">
      <h1>Privacy</h1>

      <h2>On this device</h2>
      <ul className="privacy-list">
        <li>No account, no login. Contacts, settings, and alert history live only in this browser's local storage.</li>
        <li>No analytics, ad SDKs, or third-party trackers of any kind — verify it yourself in the source.</li>
        <li>Location is only ever read to build the alert you trigger — never uploaded anywhere except as part of that alert.</li>
        <li>Uninstalling the app or clearing site data removes everything, permanently.</li>
      </ul>

      <h2>What reaches the server, and when</h2>
      <ul className="privacy-list">
        <li>
          Triggering Eyes on Me sends your message, rounded-ish location, and your contacts'
          names/emails to the relay server, once, so it can email them. Nothing is sent to the
          server at any other time — not on app open, not in the background, not on a schedule.
        </li>
        <li>
          The server does not keep the message text or contact list after sending — it stores
          only that an alert happened, roughly where, and whether it was delivered (see
          <code> server/README.md</code> for the exact schema).
        </li>
        <li>
          If there's no signal, the alert queues on your device and the server only sees it once
          your phone reconnects — that queue never leaves your device until then.
        </li>
        <li>
          Discomfort-map reports are anonymous by construction: no device or user identifier is
          ever sent. A location only appears on the public map once at least 3 people have
          reported nearby — a single report is never independently visible to anyone, including
          us.
        </li>
      </ul>

      <h2>Known limitations</h2>
      <ul className="privacy-list">
        <li>
          Nothing — app or phone — can do anything once the phone is actually powered off. That's
          not fixable by software; the "keeps trying until signal returns" feature covers dead
          zones and being offline, not a dead or switched-off phone.
        </li>
        <li>
          Background Sync (the part that retries automatically even while the app is closed) is
          supported on Chromium/Android; on Safari/Firefox the retry happens the next time you
          open the app while online instead.
        </li>
        <li>No delivery confirmation beyond "the server accepted it" — we can't know a contact actually read it.</li>
        <li>The server operator could, in principle, misuse what briefly passes through at send-time — the design minimizes what that is and how long it exists, but running your own server (see server/README.md) removes that trust requirement entirely.</li>
      </ul>
    </div>
  )
}
