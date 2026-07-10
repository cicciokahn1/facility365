function GeneralSection() {
  return (
    <section className="settings-section" aria-labelledby="sec-general">
      <header className="settings-section__header">
        <h2 id="sec-general" className="settings-section__title">
          Allgemein
        </h2>
        <p className="settings-section__desc">
          Grundlegende Einstellungen für Ihre Facility365-Organisation.
        </p>
      </header>

      <div className="settings-card">
        <h3 className="settings-card__title">Organisation</h3>
        <p className="settings-card__hint">
          Diese Angaben erscheinen in Berichten und Exporten.
        </p>

        <div className="field">
          <label className="field__label" htmlFor="org-name">
            Organisationsname
          </label>
          <input
            id="org-name"
            className="input"
            type="text"
            placeholder="z. B. Facility365 GmbH"
          />
        </div>

        <div className="field-grid">
          <div className="field">
            <label className="field__label" htmlFor="org-industry">
              Branche
            </label>
            <select id="org-industry" className="select" defaultValue="">
              <option value="" disabled>
                Bitte wählen
              </option>
              <option>Gebäudemanagement</option>
              <option>Immobilien</option>
              <option>Industrie</option>
              <option>Gesundheitswesen</option>
              <option>Sonstiges</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="org-size">
              Unternehmensgröße
            </label>
            <select id="org-size" className="select" defaultValue="">
              <option value="" disabled>
                Bitte wählen
              </option>
              <option>1–10 Mitarbeitende</option>
              <option>11–50 Mitarbeitende</option>
              <option>51–200 Mitarbeitende</option>
              <option>200+ Mitarbeitende</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Region & Format</h3>
        <p className="settings-card__hint">
          Sprache, Zeitzone und Formate für die gesamte Oberfläche.
        </p>

        <div className="field-grid">
          <div className="field">
            <label className="field__label" htmlFor="lang">
              Sprache
            </label>
            <select id="lang" className="select" defaultValue="de">
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="it">Italiano</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="tz">
              Zeitzone
            </label>
            <select id="tz" className="select" defaultValue="cet">
              <option value="cet">(UTC+01:00) Berlin, Wien, Zürich</option>
              <option value="utc">(UTC+00:00) London</option>
              <option value="eet">(UTC+02:00) Athen, Helsinki</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="dateformat">
              Datumsformat
            </label>
            <select id="dateformat" className="select" defaultValue="dmy">
              <option value="dmy">TT.MM.JJJJ</option>
              <option value="mdy">MM/TT/JJJJ</option>
              <option value="ymd">JJJJ-MM-TT</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="currency">
              Währung
            </label>
            <select id="currency" className="select" defaultValue="eur">
              <option value="eur">Euro (€)</option>
              <option value="chf">Schweizer Franken (CHF)</option>
              <option value="usd">US-Dollar ($)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn--primary">
          Änderungen speichern
        </button>
        <button type="button" className="btn btn--ghost">
          Zurücksetzen
        </button>
      </div>
    </section>
  )
}

export default GeneralSection
