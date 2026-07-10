function SecuritySection() {
  return (
    <section className="settings-section" aria-labelledby="sec-security">
      <header className="settings-section__header">
        <h2 id="sec-security" className="settings-section__title">
          Sicherheit
        </h2>
        <p className="settings-section__desc">
          Schützen Sie Ihr Konto und verwalten Sie aktive Sitzungen.
        </p>
      </header>

      <div className="settings-card">
        <h3 className="settings-card__title">Passwort ändern</h3>
        <p className="settings-card__hint">
          Verwenden Sie mindestens 12 Zeichen mit Zahlen und Sonderzeichen.
        </p>

        <div className="field">
          <label className="field__label" htmlFor="current-pw">
            Aktuelles Passwort
          </label>
          <input id="current-pw" className="input" type="password" placeholder="••••••••" />
        </div>

        <div className="field-grid">
          <div className="field">
            <label className="field__label" htmlFor="new-pw">
              Neues Passwort
            </label>
            <input id="new-pw" className="input" type="password" placeholder="••••••••" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="confirm-pw">
              Passwort bestätigen
            </label>
            <input
              id="confirm-pw"
              className="input"
              type="password"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="btn-row">
          <button type="button" className="btn btn--primary">
            Passwort aktualisieren
          </button>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Zwei-Faktor-Authentifizierung</h3>

        <div className="toggle-row">
          <div className="toggle-row__text">
            <span className="toggle-row__label">Authenticator-App</span>
            <span className="toggle-row__desc">
              Zusätzlicher Code aus einer App bei der Anmeldung.
            </span>
          </div>
          <label className="switch">
            <input type="checkbox" />
            <span className="switch__slider" />
          </label>
        </div>

        <div className="toggle-row">
          <div className="toggle-row__text">
            <span className="toggle-row__label">SMS-Code</span>
            <span className="toggle-row__desc">
              Einmalcode an Ihre hinterlegte Telefonnummer.
            </span>
          </div>
          <label className="switch">
            <input type="checkbox" />
            <span className="switch__slider" />
          </label>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Aktive Sitzungen</h3>
        <p className="settings-card__hint">
          Geräte, die aktuell bei Ihrem Konto angemeldet sind.
        </p>

        <div className="toggle-row">
          <div className="toggle-row__text">
            <span className="toggle-row__label">
              Chrome · Windows <span className="badge">Aktuell</span>
            </span>
            <span className="toggle-row__desc">Berlin, Deutschland · gerade aktiv</span>
          </div>
        </div>

        <div className="toggle-row">
          <div className="toggle-row__text">
            <span className="toggle-row__label">Facility365 App · iOS</span>
            <span className="toggle-row__desc">Hamburg, Deutschland · vor 3 Std.</span>
          </div>
          <button type="button" className="btn btn--ghost">
            Abmelden
          </button>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Konto</h3>
        <div className="toggle-row">
          <div className="toggle-row__text">
            <span className="toggle-row__label">Von allen Geräten abmelden</span>
            <span className="toggle-row__desc">
              Beendet alle aktiven Sitzungen außer der aktuellen.
            </span>
          </div>
          <button type="button" className="btn btn--danger">
            Alle abmelden
          </button>
        </div>
      </div>
    </section>
  )
}

export default SecuritySection
