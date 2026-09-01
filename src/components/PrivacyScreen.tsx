export function PrivacyScreen() {
  return (
    <div className="screen">
      <h1>Privacy</h1>
      <ul className="privacy-list">
        <li>No account, no login, no server. This app has nothing to breach because it has no backend.</li>
        <li>No analytics, ad SDKs, or third-party trackers of any kind — verify it yourself in the source.</li>
        <li>Contacts, settings, and alert history are stored only in this browser's local storage on this device.</li>
        <li>Location is only ever read to build the message you choose to send — it is never uploaded anywhere by this app.</li>
        <li>
          Sending an alert opens your device's own share sheet or SMS app — that final send is
          always your device sending it, not us.
        </li>
        <li>Uninstalling the app or clearing site data removes everything, permanently.</li>
      </ul>

      <h2>Known limitations</h2>
      <ul className="privacy-list">
        <li>
          Browsers do not allow a web page to send an SMS or place a call without you tapping send
          — this app gets you to that final tap in one motion, but can't automate past it.
        </li>
        <li>Still needs GPS/network signal for a location fix, and cell signal to actually send.</li>
        <li>No delivery confirmation — the app cannot know whether your contact received the alert.</li>
      </ul>
    </div>
  )
}
