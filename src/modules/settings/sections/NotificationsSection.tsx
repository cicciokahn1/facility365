type ToggleItem = {
  id: string
  label: string
  desc: string
  defaultOn?: boolean
}

const emailItems: ToggleItem[] = [
  {
    id: 'ntf-tickets',
    label: 'Neue Tickets & Aufträge',
    desc: 'Benachrichtigung bei neu zugewiesenen Wartungsaufträgen.',
    defaultOn: true,
  },
  {
    id: 'ntf-comments',
    label: 'Kommentare & Erwähnungen',
    desc: 'Wenn Sie in einem Vorgang erwähnt werden.',
    defaultOn: true,
  },
  {
    id: 'ntf-reports',
    label: 'Wöchentlicher Bericht',
    desc: 'Zusammenfassung der offenen Vorgänge jeden Montag.',
  },
]

const pushItems: ToggleItem[] = [
  {
    id: 'ntf-push-urgent',
    label: 'Dringende Störungen',
    desc: 'Sofortige Push-Nachricht bei kritischen Meldungen.',
    defaultOn: true,
  },
  {
    id: 'ntf-push-reminders',
    label: 'Fällige Aufgaben',
    desc: 'Erinnerung an Aufgaben mit näher rückendem Fälligkeitsdatum.',
  },
]

function ToggleRow({ item }: { item: ToggleItem }) {
  return (
    <div className="toggle-row">
      <div className="toggle-row__text">
        <span className="toggle-row__label">{item.label}</span>
        <span className="toggle-row__desc">{item.desc}</span>
      </div>
      <label className="switch">
        <input type="checkbox" defaultChecked={item.defaultOn} />
        <span className="switch__slider" />
      </label>
    </div>
  )
}

function NotificationsSection() {
  return (
    <section className="settings-section" aria-labelledby="sec-notifications">
      <header className="settings-section__header">
        <h2 id="sec-notifications" className="settings-section__title">
          Benachrichtigungen
        </h2>
        <p className="settings-section__desc">
          Legen Sie fest, worüber und auf welchem Weg Sie informiert werden.
        </p>
      </header>

      <div className="settings-card">
        <h3 className="settings-card__title">E-Mail-Benachrichtigungen</h3>
        <p className="settings-card__hint">
          Zustellung an Ihre hinterlegte E-Mail-Adresse.
        </p>
        {emailItems.map((item) => (
          <ToggleRow key={item.id} item={item} />
        ))}
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Push-Benachrichtigungen</h3>
        <p className="settings-card__hint">Für die mobile App und den Browser.</p>
        {pushItems.map((item) => (
          <ToggleRow key={item.id} item={item} />
        ))}
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Ruhezeiten</h3>
        <p className="settings-card__hint">
          In diesem Zeitraum werden keine Push-Nachrichten gesendet.
        </p>
        <div className="field-grid">
          <div className="field">
            <label className="field__label" htmlFor="quiet-from">
              Von
            </label>
            <input id="quiet-from" className="input" type="time" defaultValue="20:00" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="quiet-to">
              Bis
            </label>
            <input id="quiet-to" className="input" type="time" defaultValue="07:00" />
          </div>
        </div>
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn--primary">
          Einstellungen speichern
        </button>
      </div>
    </section>
  )
}

export default NotificationsSection
