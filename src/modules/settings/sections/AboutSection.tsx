function AboutSection() {
  return (
    <section className="settings-section" aria-labelledby="sec-about">
      <header className="settings-section__header">
        <h2 id="sec-about" className="settings-section__title">
          Über Facility365
        </h2>
        <p className="settings-section__desc">
          Informationen zur Anwendung, Version und rechtliche Hinweise.
        </p>
      </header>

      <div className="settings-card">
        <div className="avatar-row" style={{ marginBottom: 8 }}>
          <div className="avatar" aria-hidden="true">
            F
          </div>
          <div>
            <h3 className="settings-card__title" style={{ marginBottom: 2 }}>
              Facility365
            </h3>
            <p className="settings-card__hint" style={{ marginBottom: 0 }}>
              Plattform für modernes Gebäude- und Facility-Management.
            </p>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Details</h3>
        <ul className="about-list">
          <li>
            <span className="about-list__key">Version</span>
            <span>10.0.0 (Sprint 10)</span>
          </li>
          <li>
            <span className="about-list__key">Ausgabe</span>
            <span>Enterprise</span>
          </li>
          <li>
            <span className="about-list__key">Letztes Update</span>
            <span>10.07.2026</span>
          </li>
          <li>
            <span className="about-list__key">Lizenz</span>
            <span>Aktiv</span>
          </li>
        </ul>
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Rechtliches & Support</h3>
        <div className="about-links">
          <a href="#">Nutzungsbedingungen</a>
          <a href="#">Datenschutzerklärung</a>
          <a href="#">Impressum</a>
          <a href="#">Support kontaktieren</a>
        </div>
        <p className="settings-card__hint" style={{ marginTop: 16, marginBottom: 0 }}>
          © 2026 Facility365. Alle Rechte vorbehalten.
        </p>
      </div>
    </section>
  )
}

export default AboutSection
