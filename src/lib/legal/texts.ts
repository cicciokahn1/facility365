/** Rechtstexte (AGB, AVV und Datenschutzerklaerung) als einfache Markdown-Bloecke. */
export const AGB_MD = `# Allgemeine Geschäftsbedingungen (AGB) – Facility365

**Version 2.0 – gültig ab Oktober 2026**
**Betreiber: Francesco Macedonio, Guglerstrasse 31, 4512 Bellach, Schweiz – francesco.macedonio@hotmail.ch**

> Hinweis: Diese Fassung wurde technisch aktualisiert. Vor dem kommerziellen Start ist eine juristische Prüfung nach Schweizer Recht empfohlen.

## 1. Geltungsbereich

Diese AGB gelten für die Nutzung der Web-Anwendung «Facility365» («Dienst») durch Kunden («Nutzer»). Mit Registrierung oder Bestellung akzeptiert der Nutzer diese AGB. Abweichende Bedingungen des Nutzers gelten nur, wenn der Betreiber ihnen schriftlich zustimmt.

## 2. Leistungsumfang

Facility365 ist eine Software-as-a-Service zur Facility-Management-Organisation: Aufträge, Schadensmeldungen, Kontrollen, Wartungen, Rapporte, Reinigung, Rechnungen und Dokumentation. Der konkrete Leistungsumfang richtet sich nach dem gebuchten Paket auf der Preisseite (Starter, Property, Industry, Care, Public, Professional sowie individuelle Enterprise-Pakete). Zusatzmodule können einzeln zugebucht werden und werden separat verrechnet.

Der Betreiber bemüht sich um einen störungsfreien Betrieb, gewährleistet jedoch keine ununterbrochene Verfügbarkeit (z. B. Wartung, Updates, Störungen der Hosting-Partner Vercel und Supabase).

## 3. Registrierung und Konto

Die Registrierung erfolgt mit E-Mail-Adresse und Passwort; die E-Mail-Adresse wird per Bestätigungsmail verifiziert. Der Nutzer ist für die Geheimhaltung seiner Zugangsdaten verantwortlich. Pro Konto (Mandant) dürfen nur Personen der im Paket definierten Organisation arbeiten. Der Nutzer ist für alle Handlungen unter seinem Konto verantwortlich.

## 4. Testphase und Vertragsbeginn

Neue Konten starten mit einer kostenlosen 30-tägigen Testphase. Nach deren Ablauf ist für die weitere Nutzung ein kostenpflichtiges Abonnement erforderlich.

## 5. Preise und Zahlung

Die Preise ergeben sich aus der aktuellen Preisseite (CHF, exkl. MWST). Grundlage ist der jeweilige Jahrespreis; der auf der Preisseite angezeigte Monatsbetrag ist die Umrechnung des Jahrespreises auf zwölf Monate. Zusätzlich zum Abonnement kann eine einmalige Einrichtungsgebühr anfallen, deren Höhe im Angebot ausgewiesen wird. Datenübernahme, umfangreiche Schulungen und individuelle Konfiguration sind nicht Teil der Einrichtungspauschale und werden separat offeriert. Zahlbar innert 30 Tagen per Rechnung. Bei Zahlungsverzug kann der Zugang nach Mahnung gesperrt werden.

## 6. Vertragsdauer und Kündigung

Das Abonnement verlängert sich automatisch um die gewählte Laufzeit (Monat oder Jahr), sofern es nicht 30 Tage vor Ablauf gekündigt wird. Kündigung per E-Mail an den Betreiber genügt. Nach Vertragsende stehen die Daten 90 Tage zum Export bereit und werden danach gelöscht.

## 7. Daten und Datenschutz

Der Nutzer bleibt Eigentümer seiner Daten. Der Betreiber verarbeitet Daten ausschliesslich zur Leistungserbringung gemäss Datenschutzerklärung. Der Nutzer ist verantwortlich für die Rechtmässigkeit der von ihm eingegebenen Daten (z. B. Personendaten von Mietern).

## 8. Backup und Datenverantwortung

Der Betreiber erstellt automatische Sicherungen über den Datenbankanbieter. Der Nutzer wird zusätzlich empfohlen, regelmässig eigene Exporte zu erstellen.

## 9. Haftung

Der Betreiber haftet nur für Schäden aus vorsätzlichem oder grob fahrlässigem Verhalten. Die Haftung für leichte Fahrlässigkeit, indirekte Schäden, Folgeschäden und entgangenen Gewinn ist – soweit gesetzlich zulässig – ausgeschlossen. Der Nutzer ist verpflichtet, rechtlich relevante Kontrollen (z. B. Brandschutz, SUVA) zusätzlich gemäss den geltenden Normen eigenverantwortlich zu dokumentieren; die App dient als Hilfsmittel, nicht als rechtsverbindlicher Nachweis.

## 10. Geistiges Eigentum

Alle Rechte an der Software (Code, Design, Marke) verbleiben beim Betreiber. Der Nutzer erhält ein nicht übertragbares, nicht ausschliessliches Nutzungsrecht für die Vertragsdauer.

## 11. Schlussbestimmungen

Es gilt schweizerisches Recht unter Ausschluss des UN-Kaufrechts (CISG). Gerichtsstand ist der Sitz des Betreibers. Sollten einzelne Bestimmungen unwirksam sein, bleibt der Rest gültig; die unwirksame Klausel wird durch eine gültige ersetzt, die dem wirtschaftlichen Zweck am nächsten kommt.
`;

export const DPA_MD = `# Auftragsverarbeitungsvertrag (AVV) – Facility365

**Version 2.0 – gültig ab Oktober 2026**
zwischen **Francesco Macedonio, Guglerstrasse 31, 4512 Bellach, Schweiz** («Auftragsbearbeiter») und dem Kunden von Facility365 («Verantwortliche Stelle»).

> Hinweis: Der Kunde akzeptiert diesen Vertrag mit der Nutzung der App; für grosse Kunden kann eine unterschriebene Version vereinbart werden. Juristische Prüfung vor kommerziellem Start empfohlen.

## 1. Gegenstand

Der Auftragsbearbeiter stellt die Software Facility365 zur Verfügung und bearbeitet dabei Personendaten im Auftrag der verantwortlichen Stelle (z. B. Daten zu Mietern, Bewohnern, Mitarbeitenden und Lieferanten).

## 2. Art und Zweck der Bearbeitung

- Speicherung und Bereitstellung der vom Kunden erfassten Inhalte.
- Sicherung (Backup), Fehlerbehebung und Support.
- Mitteilungen innerhalb der App (inkl. vorbereiteter Push-Mitteilungen).
- Versand von System-E-Mails (z. B. Kontobestätigung) über den Authentifizierungsdienst.

Es erfolgt keine Verwendung zu eigenen Zwecken, kein Verkauf und keine Weitergabe zu Werbezwecken.

## 3. Datenkategorien und betroffene Personen

Name und Kontaktdaten von Personen, Auftrags-/Schaden-/Rapportdaten, Fotos, Dokumente, Zähler-/Verbrauchsdaten, technische Zugriffsdaten. Betroffene Personen: Mitarbeitende und Kunden des Kunden, Mieter, Bewohner, Lieferanten.

## 4. Dauer

Vertragsdauer der App-Nutzung. Nach Vertragsende stehen die Daten 90 Tage zum Export bereit und werden danach gelöscht, sofern keine gesetzliche Pflicht besteht.

## 5. Technische und organisatorische Massnahmen (TOMs)

- Verschlüsselte Übertragung (HTTPS/TLS).
- Datentrennung zwischen den Betrieben auf Datenbankebene (Row Level Security je Mandant).
- Rollenbasierte Zugriffsrechte; Zugang nur für befugte Nutzer.
- E-Mail-Verifikation bei der Registrierung.
- Automatische Backups des Datenbankanbieters.
- Updates und Sicherheits-Patches des Systems.
- Vertraulichkeitsverpflichtung des Betreibers.

## 6. Unterauftragsbearbeiter

Die verantwortliche Stelle stimmt dem Einsatz folgender Unterauftragsbearbeiter zu:

- **Vercel Inc.** (USA) – Auslieferung der Web-Anwendung. [OFFEN: genutzte Serverregion zu bestätigen]
- **Supabase Inc.** (USA) – Datenbank und Authentifizierung. [OFFEN: Projektregion zu bestätigen – im Supabase-Dashboard einsehbar]
- **E-Mail-Versand:** aktuell der eingebaute E-Mail-Dienst von Supabase. Ein eigener SMTP-Anbieter ist noch nicht eingerichtet und wird vor Einsatz nachträglich mitgeteilt.

Neue Unterauftragsbearbeiter werden den Kunden vorab mitgeteilt; Widerspruch innert 14 Tagen möglich.

## 7. Rechte und Pflichten der verantwortlichen Stelle

- Sicherstellen, dass die eingegebenen Personendaten rechtmässig erhoben wurden (z. B. Information der Mieter).
- Meldung von Datenschutzverletzungen an den Auftragsbearbeiter, damit die Meldung an Betroffene/EDÖB koordiniert werden kann.
- Der Auftragsbearbeiter unterstützt bei Auskunfts- und Löschbegehren, soweit zumutbar.

## 8. Kontrolle

Die verantwortliche Stelle kann Einhaltung der Massnahmen verlangen (Berichte, Nachweise); Vor-Ort-Prüfungen nach Absprache in zumutbarem Rahmen.

## 9. Haftung

Es gilt die Haftungsregelung der AGB. Der Auftragsbearbeiter haftet nicht für Rechtsverletzungen durch vom Kunden rechtswidrig eingegebene Daten.

## 10. Schlussbestimmung

Schweizerisches Recht; Gerichtsstand wie in den AGB.
`;

export const PRIVACY_MD = `# Datenschutzerklärung – Facility365

**Version 2.0 – gültig ab Oktober 2026**
**Verantwortliche Stelle: Francesco Macedonio, Guglerstrasse 31, 4512 Bellach, Schweiz – francesco.macedonio@hotmail.ch**

> Hinweis: Nach dem Schweizer Datenschutzgesetz (nDSG / revDSG). Technisch aktualisierte Fassung – juristische Prüfung empfohlen.

## 1. Grundsätze

Wir bearbeiten Personendaten ausschliesslich im Rahmen des Schweizer Datenschutzgesetzes (nDSG) und nur, soweit es für den Betrieb von Facility365 erforderlich ist.

## 2. Welche Daten wir bearbeiten

- **Kontodaten:** Name, E-Mail, Rolle, Passwort-Hash, Spracheinstellung.
- **Betriebsdaten:** alle Inhalte, die Sie in der App erfassen (Aufträge, Schäden, Rapporte, Fotos, Dokumente, Personenbezüge zu Mietern, Kunden und Mitarbeitenden).
- **Technische Daten:** Gerätetyp, Browser, IP-Adresse, Zugriffszeiten.
- **Lokale Speicherung:** Für den Offline-Betrieb werden Änderungen vorübergehend im Browser-Speicher (localStorage) Ihres Geräts gehalten, bis sie mit dem Server synchronisiert sind.
- **Push-Mitteilungen:** Browser-Abo-Kennung (Funktion vorbereitet, nur falls aktiviert).

## 3. Zweck

Daten werden nur verwendet, um den Dienst bereitzustellen: Speicherung und Anzeige Ihrer Inhalte, Mitteilungen, Sicherungen, Fehlerbehebung und Weiterentwicklung. Es gibt **keine Weitergabe an Dritte zu Werbezwecken und kein Profiling**.

## 4. Hosting und Auftragsbearbeiter

- **Web-Anwendung:** Vercel Inc. (USA) – Auslieferung der App. [OFFEN: genutzte Region zu bestätigen]
- **Datenbank, Authentifizierung und Backups:** Supabase Inc. (USA). [OFFEN: Projektregion zu bestätigen – im Supabase-Dashboard einsehbar]
- **E-Mail:** Der Versand von System-E-Mails (z. B. Kontobestätigung) erfolgt derzeit über den E-Mail-Dienst von Supabase; ein eigener SMTP-Anbieter ist noch nicht eingerichtet.

Es gelten die Datenschutzbestimmungen der jeweiligen Auftragsbearbeiter. Eine ausschliessliche Speicherung sämtlicher Daten in der Schweiz ist zum jetzigen Zeitpunkt **nicht** gegeben; Übermittlungen ins Ausland erfolgen nur zu Anbietern mit angemessenem Schutzniveau.

## 5. Speicherdauer

Ihre Inhalte bleiben für die Vertragsdauer gespeichert. Nach Kündigung stehen die Daten 90 Tage zum Export bereit und werden danach gelöscht, sofern keine gesetzliche Aufbewahrungspflicht besteht.

## 6. Ihre Rechte

Sie haben Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Bearbeitung sowie Datenübertragbarkeit. Wenden Sie sich dafür an francesco.macedonio@hotmail.ch. Beschwerderecht beim EDÖB (Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter).

## 7. Sicherheit

Wir schützen Daten mit verschlüsselter Übertragung (HTTPS), Datentrennung zwischen Betrieben auf Datenbankebene, rollenbasierter Rechteverwaltung, E-Mail-Verifikation und regelmässigen Backups. Sie sind für Ihre eigenen Geräte und Zugangsdaten verantwortlich.

## 8. Cookies und lokale Speicherung

Facility365 verwendet technisch notwendige Cookies und lokalen Speicher (z. B. Sitzungsdaten, Offline-Warteschlange, Einstellungen). Es gibt keine Marketing- oder Tracking-Cookies.

## 9. Änderungen

Wir können diese Erklärung anpassen; die jeweils aktuelle Version ist in der App unter «Rechtliches» abrufbar.
`;
