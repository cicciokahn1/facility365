function AppearanceSection() {
  return (
    <section className="settings-section" aria-labelledby="sec-appearance">
      <header className="settings-section__header">
        <h2 id="sec-appearance" className="settings-section__title">
          Darstellung
        </h2>
        <p className="settings-section__desc">
          Passen Sie das Erscheinungsbild von Facility365 an Ihre Vorlieben an.
        </p>
      </header>

      <div className="settings-card">
        <h3 className="settings-card__title">Farbschema</h3>
        <p className="settings-card__hint">Wählen Sie ein Thema für die Oberfläche.</p>

        <div className="theme-options">
          <div className="theme-card is-selected">
            <div className="theme-card__preview theme-card__preview--light" />
            <span className="theme-card__label">Hell</span>
          </div>
          <div className="theme-card">
            <div className="theme-card__preview theme-card__preview--dark" />
            <span className="theme-card__label">Dunkel</span>
          </div>
          <div className="theme-card">
            <div className="theme-card__preview theme-card__preview--system" />
            <span className="theme-card__label">System</span>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Layout & Lesbarkeit</h3>

        <div className="field-grid">
          <div className="field">
            <label className="field__label" htmlFor="accent">
              Akzentfarbe
            </label>
            <select id="accent" className="select" defaultValue="blue">
              <option value="blue">Blau</option>
              <option value="green">Grün</option>
              <option value="purple">Violett</option>
              <option value="orange">Orange</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="font-size">
              Schriftgröße
            </label>
            <select id="font-size" className="select" defaultValue="m">
              <option value="s">Klein</option>
              <option value="m">Mittel</option>
              <option value="l">Groß</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="density">
              Anzeigedichte
            </label>
            <select id="density" className="select" defaultValue="comfortable">
              <option value="compact">Kompakt</option>
              <option value="comfortable">Komfortabel</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="sidebar-pos">
              Seitenleiste
            </label>
            <select id="sidebar-pos" className="select" defaultValue="left">
              <option value="left">Links</option>
              <option value="right">Rechts</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Zusätzliche Optionen</h3>

        <div className="toggle-row">
          <div className="toggle-row__text">
            <span className="toggle-row__label">Animationen reduzieren</span>
            <span className="toggle-row__desc">
              Weniger Bewegung für ruhigere Darstellung.
            </span>
          </div>
          <label className="switch">
            <input type="checkbox" />
            <span className="switch__slider" />
          </label>
        </div>

        <div className="toggle-row">
          <div className="toggle-row__text">
            <span className="toggle-row__label">Seitenleiste einklappen</span>
            <span className="toggle-row__desc">
              Navigation standardmäßig schmal anzeigen.
            </span>
          </div>
          <label className="switch">
            <input type="checkbox" />
            <span className="switch__slider" />
          </label>
        </div>
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn--primary">
          Darstellung übernehmen
        </button>
      </div>
    </section>
  )
}

export default AppearanceSection
