function UserProfileSection() {
  return (
    <section className="settings-section" aria-labelledby="sec-profile">
      <header className="settings-section__header">
        <h2 id="sec-profile" className="settings-section__title">
          Benutzerprofil
        </h2>
        <p className="settings-section__desc">
          Verwalten Sie Ihre persönlichen Angaben und Kontaktdaten.
        </p>
      </header>

      <div className="settings-card">
        <h3 className="settings-card__title">Profilbild</h3>
        <p className="settings-card__hint">
          PNG oder JPG, empfohlen 256×256&nbsp;px.
        </p>

        <div className="avatar-row">
          <div className="avatar" aria-hidden="true">
            MM
          </div>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn--ghost">
              Bild hochladen
            </button>
            <button type="button" className="btn btn--ghost">
              Entfernen
            </button>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Persönliche Daten</h3>

        <div className="field-grid">
          <div className="field">
            <label className="field__label" htmlFor="first-name">
              Vorname
            </label>
            <input id="first-name" className="input" type="text" placeholder="Max" />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="last-name">
              Nachname
            </label>
            <input
              id="last-name"
              className="input"
              type="text"
              placeholder="Mustermann"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="email">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="max.mustermann@beispiel.de"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="phone">
              Telefon
            </label>
            <input
              id="phone"
              className="input"
              type="tel"
              placeholder="+49 30 1234567"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="role">
              Rolle / Position
            </label>
            <input
              id="role"
              className="input"
              type="text"
              placeholder="Facility Manager"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="department">
              Abteilung
            </label>
            <input
              id="department"
              className="input"
              type="text"
              placeholder="Gebäudetechnik"
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="bio">
            Über mich
          </label>
          <textarea
            id="bio"
            className="textarea"
            placeholder="Kurze Beschreibung Ihrer Tätigkeit…"
          />
          <span className="field__help">Maximal 240 Zeichen.</span>
        </div>
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn--primary">
          Profil speichern
        </button>
        <button type="button" className="btn btn--ghost">
          Abbrechen
        </button>
      </div>
    </section>
  )
}

export default UserProfileSection
