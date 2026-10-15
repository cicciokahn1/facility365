/**
 * Inhalte des Hilfe-Centers.
 *
 * Die Anleitung ist bewusst einfach geschrieben und richtet sich an neue
 * Mitarbeitende ohne Vorkenntnisse. Sie beschreibt die komplette App:
 * jedes Modul, jeden Zweck und die wichtigsten Schritte.
 */

export interface HelpStep {
  /** Kurzer Titel des Schritts, z. B. «Öffnen». */
  title: string;
  text: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  summary: string;
  /** Erklärender Text in kurzen Abschnitten. */
  paragraphs: string[];
  /** «So funktioniert es» - Schritt für Schritt. */
  steps?: HelpStep[];
  /** Seite in Facility365, die zum Thema gehört. */
  path?: string;
  /** Zusätzliche Suchbegriffe. */
  keywords?: string[];
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  articles: HelpArticle[];
}

const OPEN = (where: string): HelpStep => ({
  title: "1. Öffnen",
  text: `Im Menü ${where} wählen. Auf dem Telefon zuerst unten auf «Mehr» tippen.`,
});

const CREATE: HelpStep = {
  title: "2. Erstellen",
  text: "Oben rechts auf «Neu» klicken. Das Formular öffnet sich mit einer automatischen Nummer. Sind mehr Felder nötig, «Mehr anzeigen» antippen.",
};

const EDIT: HelpStep = {
  title: "3. Bearbeiten",
  text: "Pflichtfelder ausfüllen und die Zuordnung (Kunde, Liegenschaft, Gebäude, Raum, Anlage) setzen. Fotos und Dokumente können direkt angehängt werden.",
};

const SAVE: HelpStep = {
  title: "4. Speichern",
  text: "Mit «Speichern» sichern. Der Eintrag erscheint sofort in der Liste, jede Änderung wird in der Historie festgehalten.",
};

const CLOSE = (status: string): HelpStep => ({
  title: "5. Abschliessen",
  text: `Ist die Arbeit erledigt, den Status auf «${status}» setzen oder die Schaltfläche «Erledigt» verwenden. Der Eintrag bleibt erhalten und ist über den Filter jederzeit wieder sichtbar.`,
});

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "start",
    title: "Erste Schritte",
    description: "Was Facility365 ist und wie die App aufgebaut ist.",
    articles: [
      {
        id: "what",
        title: "Was ist Facility365?",
        summary: "Ein System für den ganzen Gebäudeunterhalt.",
        paragraphs: [
          "Facility365 ist die zentrale Arbeitsumgebung für Hauswartung, Technik, Reinigung und Verwaltung. Alle Objekte, Aufträge, Kontrollen, Dokumente, Lieferanten und Kosten liegen an einem Ort statt in Listen, Mappen und Mails.",
          "Jede Person sieht nur, was zu ihrer Rolle und ihren Standorten gehört. Nichts geht verloren: gelöschte Einträge wandern in den Papierkorb, jede Änderung steht in der Historie.",
          "Die App läuft auf Computer, Tablet und Telefon und funktioniert auch offline - ohne Empfang wird weitergearbeitet, Änderungen gleichen sich später automatisch ab. Auf dem Telefon kann sie wie eine App zum Startbildschirm hinzugefügt werden.",
        ],
        keywords: ["einstieg", "überblick", "was ist", "offline"],
      },
      {
        id: "structure",
        title: "Wie ist die App aufgebaut?",
        summary: "Menü, Kopfzeile, Listen und Detailansichten.",
        paragraphs: [
          "Im einfachen Modus ist das Menü eine flache Liste ohne Ordner: Heute, Kalender, Favoriten, Kunden, Liegenschaften, Wartungen, Schäden, Aufträge, Helpdesk, Reinigungsaufgaben, Aussenanlagen und darunter der Abschnitt «Administration» mit Rapporte, Rechnungen, Papierkorb, Hilfe und Einstellungen. Ist der einfache Modus aus, erscheinen Ordner: Objekte, Technik & Instandhaltung, Aufträge & Rapporte, Reinigung, Energie, Betrieb, Dokumente & Verträge, Auswertungen, Benutzer und Administration. Den einfachen Modus schaltet man in den Einstellungen ein und aus.",
          "Oben in der Kopfzeile stehen die globale Suche (Lupe oder Strg + K), der QR-Scanner und das Brief-Symbol für die Outlook-Mails. Auf dem Telefon führt «Mehr» unten zum ganzen Menü.",
          "Jedes Modul zeigt eine Liste mit Suche, Filtern und Sortierung. Erledigte Einträge sind standardmässig ausgeblendet; mit dem Filter «Alle» werden sie wieder angezeigt. Ein Klick auf einen Eintrag öffnet die Detailansicht mit Reitern für Angaben, Fotos, Dokumente und Historie.",
        ],
        keywords: ["navigation", "menu", "suche", "aufbau", "einfacher modus", "administration"],
      },
      {
        id: "hierarchy",
        title:
          "Organisation → Standort → Liegenschaft → Gebäude → Raum → Anlage",
        summary: "Die Struktur, auf der alles aufbaut.",
        paragraphs: [
          "Die Organisation ist das Unternehmen oder die Verwaltung. Ein Standort fasst mehrere Liegenschaften zusammen (optional, z. B. eine Region oder ein Areal).",
          "Eine Liegenschaft ist die Adresse bzw. das Grundstück. Dazu gehören ein oder mehrere Gebäude, im Gebäude liegen die Räume, und im Raum stehen die Anlagen (Heizung, Lift, Lüftung, Beleuchtung usw.).",
          "Jeder Auftrag, Schaden, jede Kontrolle und Wartung wird dieser Struktur zugeordnet. Dadurch stimmen Auswertungen, Rechte und Kosten automatisch.",
        ],
        steps: [
          OPEN("den Ordner «Objekte» oder «Liegenschaften»"),
          {
            title: "2. Erstellen",
            text: "Von oben nach unten anlegen: zuerst Liegenschaft, dann Gebäude, dann Räume, dann Anlagen.",
          },
          {
            title: "3. Bearbeiten",
            text: "Beim Gebäude die Liegenschaft wählen, beim Raum das Gebäude, bei der Anlage den Raum. Die übergeordnete Ebene wird dabei automatisch mitgeführt.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Die fertige Struktur steht in allen Modulen zur Auswahl - sie muss nur einmal erfasst werden.",
          },
        ],
        path: "/properties",
        keywords: [
          "hierarchie",
          "struktur",
          "liegenschaft",
          "gebäude",
          "raum",
          "anlage",
        ],
      },
      {
        id: "demo",
        title: "Beispiel-Daten",
        summary: "Die App mit echten Beispielen ausprobieren.",
        paragraphs: [
          "Auf einem leeren Gerät lädt Facility365 beim ersten Start automatisch Beispiel-Daten: mehrere Liegenschaften mit Kunden, Gebäuden, Anlagen, Wartungen, Schäden, Aufträgen, Terminen, Reinigungsaufgaben und Aussenanlagen - alles verknüpft wie im echten Betrieb.",
          "Mit «Beispiel-Daten laden» in den Einstellungen lassen sie sich jederzeit erneut laden oder ersetzen.",
        ],
        path: "/settings",
        keywords: ["beispiel", "demo", "testdaten", "probieren"],
      },
      {
        id: "plans",
        title: "Gebäudepläne, Flächen und Arbeitsplätze",
        summary: "Pläne nutzen, Räume und Anlagen darauf setzen.",
        paragraphs: [
          "Zu jedem Gebäude und jeder Liegenschaft lassen sich Pläne hinterlegen (Bild oder PDF), je Stockwerk und mit Fassungen - eine neue Fassung ersetzt die alte nicht, sondern legt sich darüber.",
          "Auf Bildplänen können Räume und Anlagen als Markierung gesetzt, verschoben, bearbeitet und wieder entfernt werden. Ein Klick auf die Markierung führt direkt zum Raum oder zur Anlage.",
          "Flächen werden beim Gebäude, beim Stockwerk und beim Raum erfasst; beim Raum zusätzlich die Anzahl Arbeitsplätze und die Nutzung. Der Reiter «Flächen» wertet das aus: Gesamtfläche, Fläche je Stockwerk und je Raumart, Anzahl Arbeitsplätze und fehlende Flächen.",
        ],
        path: "/buildings",
        keywords: [
          "plan",
          "grundriss",
          "fläche",
          "quadratmeter",
          "arbeitsplatz",
          "markierung",
        ],
      },
      {
        id: "maps",
        title: "Karte und Navigation",
        summary: "Objekte auf der Karte, Route zum Standort.",
        paragraphs: [
          "Bei jeder Liegenschaft zeigt der Reiter «Karte» die Adresse auf Google Maps. Der Schaltknopf «Route» öffnet die Navigation - auf dem Telefon startet sie direkt.",
          "In der Liegenschaften-Liste zeigt «Alle auf Karte» alle Objekte gemeinsam. Auch bei Aufträgen und Lieferanten führt «Route» zum gespeicherten Standort.",
        ],
        path: "/properties",
        keywords: ["karte", "maps", "navigation", "route", "adresse", "google maps"],
      },
      {
        id: "push",
        title: "Benachrichtigungen und Push-Mitteilungen",
        summary: "Melden, was neu ist - pro Ereignis steuerbar.",
        paragraphs: [
          "Unter Einstellungen → Mitteilungen schaltet jede Person einzeln ein, wozu sie benachrichtigt wird: Zuweisungen, neue Aufträge, fällige und überfällige Wartungen, neue Meldungen und wichtige Statusänderungen.",
          "Ein Tipp auf die Mitteilung öffnet direkt den passenden Auftrag, die Wartung oder die Meldung. Doppelmeldungen werden vermieden, und beim Ausschalten wird das Gerät sauber abgemeldet.",
          "Auf dem iPhone muss die App zuerst über «Teilen → Zum Home-Bildschirm» installiert werden, damit Mitteilungen ankommen.",
        ],
        path: "/settings",
        keywords: ["push", "mitteilung", "benachrichtigung", "erinnerung", "abmelden"],
      },
      {
        id: "pdf",
        title: "PDF-Export",
        summary: "Alle Dokumente als sauberes A4-PDF.",
        paragraphs: [
          "Aufträge, Rapporte, Rechnungen, Offerten und Kontrollprotokolle lassen sich als PDF öffnen, herunterladen, teilen und drucken. Das Layout ist einheitlich: Logo, Firma, Nummer, Datum, Status und Seitenzahlen im Schweizer Format.",
          "Rechnungen und Offerten enthalten den QR-Einzahlungsschein. Auf dem Telefon öffnet «Teilen» das Teilen-Menü; sonst wird die Datei heruntergeladen.",
        ],
        keywords: ["pdf", "export", "drucken", "teilen", "dokument"],
      },
    ],
  },
  {
    id: "today",
    title: "Heute, Kalender und Aufgaben",
    description: "Der Arbeitstag auf einen Blick.",
    articles: [
      {
        id: "today-page",
        title: "Heute-Seite",
        summary: "Die persönliche Arbeit des Tages.",
        paragraphs: [
          "«Heute» zeigt jeder Person ihre fälligen und zugewiesenen Arbeiten: Aufträge, Wartungen, Kontrollen und Termine des Tages. Mit den Filtern «Alle», «Überfällig» und «Heute» wird die Liste sofort kleiner.",
          "Oben stehen die Schnellaktionen: Schaden melden, Notfall, Rundgang und Pflanze erkennen - die wichtigsten Wege mit einem Tipp.",
        ],
        path: "/today",
        keywords: ["heute", "überfällig", "filter", "aufgaben", "schnellaktion"],
      },
      {
        id: "calendar",
        title: "Kalender und Termine",
        summary: "Alle Termine an einem Ort.",
        paragraphs: [
          "Der Kalender zeigt Aufträge, Wartungen, Kontrollen, Winterdienst, Reinigung, Verträge, Dokumente und Fahrzeugtermine zusammen. Ein Tag antippen genügt, um einen neuen Termin zu erfassen - wie in Outlook.",
          "Mit «Auswählen» lassen sich mehrere Termine markieren und gemeinsam ändern (Datum, Verschiebung um Tage, Zeiten, Ort, Verantwortlicher, Status).",
        ],
        steps: [
          OPEN("«Kalender»"),
          {
            title: "2. Erstellen",
            text: "Tag antippen, Titel eintippen, Kunde und Liegenschaft wählen, bei Bedarf «Wöchentlich» für die Wiederholung.",
          },
          {
            title: "3. Bearbeiten",
            text: "Termin antippen und ändern; mit «Auswählen» mehrere Termine gemeinsam bearbeiten.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Erledigte Termine auf «Erledigt» setzen; sie bleiben erhalten und sind über den Filter sichtbar.",
          },
        ],
        path: "/calendar",
        keywords: ["kalender", "termin", "wiederkehrend", "outlook", "ics"],
      },
      {
        id: "favorites",
        title: "Favoriten",
        summary: "Häufige Orte und Einträge anpinnen.",
        paragraphs: [
          "Wichtige Liegenschaften, Gebäude oder Anlagen lassen sich mit dem Stern als Favorit markieren. Unter «Favoriten» stehen sie danach immer oben bereit - ein Tipp statt lange suchen.",
        ],
        path: "/favorites",
        keywords: ["favorit", "stern", "anpinnen", "schnellzugriff"],
      },
      {
        id: "work-time",
        title: "Zeiterfassung",
        summary: "Arbeitszeit starten und stoppen.",
        paragraphs: [
          "In einem Auftrag lässt sich die Zeit mit «Zeit starten» und «Stopp» direkt erfassen; Pausen werden mitgerechnet. Die Stunden fliessen in Rapport und Auswertung.",
        ],
        path: "/work-time",
        keywords: ["zeit", "stunden", "arbeitszeit", "start", "stopp"],
      },
      {
        id: "my-area",
        title: "Mein Bereich",
        summary: "Privates Notizbuch und persönliche Dateien.",
        paragraphs: [
          "Im persönlichen Bereich können eigene Notizen sowie private Ordner und Dateien verwaltet werden. Der Zugriff ist auf das eigene Konto beschränkt.",
        ],
        path: "/me",
        keywords: ["mein bereich", "notizbuch", "dateien", "ordner", "privat"],
      },
    ],
  },
  {
    id: "work",
    title: "Aufträge, Schäden und Helpdesk",
    description: "Die tägliche Arbeit erfassen und abschliessen.",
    articles: [
      {
        id: "orders",
        title: "Aufträge erstellen und bearbeiten",
        summary: "Vom neuen Auftrag bis zur Verrechnung.",
        paragraphs: [
          "Ein Auftrag beschreibt eine Arbeit mit Zuständigem, Termin und Priorität. Der Status führt durch die Bearbeitung: Offen, In Arbeit, Erledigt, Verrechnet. Zugewiesene Aufträge erscheinen bei der zuständigen Person unter «Heute» und im Kalender.",
          "Im Auftrag lassen sich Fotos, Material, Arbeitszeiten, Checkliste und Unterschrift erfassen. Der Knopf «Route» öffnet die Navigation zum Objekt, «PDF» erzeugt den Auftragsbericht.",
        ],
        steps: [
          OPEN("«Aufträge»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Titel, Beschreibung, Liegenschaft/Gebäude/Raum/Anlage, Zuständigen, Termin und Priorität setzen. Fotos direkt mit der Kamera aufnehmen.",
          },
          SAVE,
          CLOSE("Erledigt"),
        ],
        path: "/orders",
        keywords: ["auftrag", "arbeit", "aufgabe", "route", "pdf"],
      },
      {
        id: "tickets",
        title: "Helpdesk: Meldungen und Tickets",
        summary: "Meldungen zentral annehmen, zuweisen und abschliessen.",
        paragraphs: [
          "Im Helpdesk laufen alle Meldungen zusammen. Jedes Ticket erhält eine Nummer und trägt Kategorie, Priorität, Zuordnung, Beschreibung, Fotos und eine zuständige Person.",
          "Der Status führt durch die Bearbeitung: Neu, In Bearbeitung, Wartet, Erledigt, Geschlossen. Mit einer Frist erinnert die App rechtzeitig; überfällige Tickets stehen in einer eigenen Sicht.",
          "Ein Ticket lässt sich mit einem Klick in einen Auftrag umwandeln; beide bleiben verknüpft. Kommentare und Verlauf halten fest, wer wann was getan hat.",
        ],
        path: "/tickets",
        keywords: ["helpdesk", "ticket", "meldung", "support", "anfrage"],
      },
      {
        id: "damages",
        title: "Schäden erfassen und weiterbearbeiten",
        summary: "Melden, beurteilen, beheben.",
        paragraphs: [
          "Ein Schaden hält fest, was defekt ist, wo er sich befindet und wer ihn gemeldet hat. Aus einem Schaden entsteht mit einem Klick ein Auftrag; beide bleiben verknüpft.",
          "Am schnellsten geht es unterwegs: QR-Code der Anlage scannen, «Schaden melden» wählen - Ort und Anlage werden automatisch übernommen. Oder auf der Heute-Seite die Schnellaktion «Schaden» verwenden.",
        ],
        path: "/damages",
        keywords: ["schaden", "defekt", "meldung", "qr"],
      },
      {
        id: "emergency",
        title: "Notfall",
        summary: "Schnell melden, was brennt.",
        paragraphs: [
          "Die Schnellaktion «Notfall» auf der Heute-Seite meldet dringende Ereignisse (Wasser, Strom, Aufzug, Zutritt usw.) mit wenigen Tipps. Die Meldung landet als Schaden mit hoher Priorität bei den Zuständigen.",
        ],
        path: "/today",
        keywords: ["notfall", "alarm", "dringend", "wasserschaden"],
      },
      {
        id: "walkthrough",
        title: "Rundgang und Prüfmappe",
        summary: "Kontrollgänge ohne Umwege.",
        paragraphs: [
          "Der Rundgang bündelt die Bereiche Anlagen, Brandschutz, Kontrollen und Aussenanlagen in einer Prüfmappe. Bei einer Abweichung werden Foto und Bemerkung erfasst und direkt ein Schaden, Auftrag oder eine Wartung erstellt.",
        ],
        path: "/walkthrough",
        keywords: ["rundgang", "prüfmappe", "kontrollgang", "inspektion"],
      },
      {
        id: "handover",
        title: "Objektübergabe",
        summary: "Übergabe an eine andere Person dokumentieren.",
        paragraphs: [
          "Die Objektübergabe fasst Anlagen, Schlüssel, offene Arbeiten und Kontrollen einer Liegenschaft zusammen und erzeugt daraus einen Übergabebericht als PDF.",
        ],
        path: "/handover",
        keywords: ["übergabe", "stellvertretung", "ablösung"],
      },
    ],
  },
  {
    id: "objects",
    title: "Objekte und Anlagen",
    description: "Liegenschaften, Gebäude, Räume, Anlagen und QR-Codes.",
    articles: [
      {
        id: "properties",
        title: "Kunden und Liegenschaften",
        summary: "Die Basis aller Arbeiten.",
        paragraphs: [
          "Kunden führen Stammdaten, Kontaktpersonen und Dokumente. Liegenschaften führen Adresse, Gebäude, Zuständige und die Karte; der Knopf «Route» öffnet die Navigation zur Adresse.",
          "Auf dem Reiter «Karte» steht die Lage auf Google Maps, und in der Liste zeigt «Alle auf Karte» jedes Objekt gleichzeitig.",
        ],
        steps: [
          OPEN("«Kunden» oder «Liegenschaften»"),
          CREATE,
          EDIT,
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Adresse prüfen - sie steuert Karte, Route und Auswertungen.",
          },
        ],
        path: "/properties",
        keywords: ["liegenschaft", "kunde", "objekt", "adresse", "karte"],
      },
      {
        id: "assets",
        title: "Anlagen und QR-Codes",
        summary: "Jede Anlage mit Pass und Code.",
        paragraphs: [
          "Eine Anlage gehört zu einem Raum oder Gebäude und führt Typ, Hersteller, Baujahr, Seriennummer, Garantie, Wartungen, Dokumente und Fotos.",
          "Zu jeder Anlage gehört ein QR-Code. Aufgeklebt am Gerät führt er beim Scannen direkt zum Anlagenpass - mit «Schaden melden» und «Auftrag erstellen». Der Scanner sitzt oben in der Kopfzeile neben dem Brief-Symbol.",
        ],
        path: "/assets",
        keywords: ["anlage", "gerät", "qr", "anlagenpass", "scannen"],
      },
      {
        id: "rooms",
        title: "Räume und Organisationen",
        summary: "Feinere Struktur unter dem Gebäude.",
        paragraphs: [
          "Räume gehören zu einem Gebäude und tragen Fläche, Nutzung, Abteilung und Arbeitsplätze. Organisationen und Standorte fassen mehrere Liegenschaften zusammen - etwa je Region oder Verwaltung.",
        ],
        path: "/rooms",
        keywords: ["raum", "organisation", "standort", "struktur"],
      },
    ],
  },
  {
    id: "technics",
    title: "Technik, Wartung und Kontrollen",
    description: "Anlagen betreiben und Betreiberpflichten nachweisen.",
    articles: [
      {
        id: "maintenances",
        title: "Wartungen verwalten",
        summary: "Wiederkehrende Arbeiten planen.",
        paragraphs: [
          "Eine Wartung gehört zu einer Anlage und hat ein Intervall (z. B. jährlich). Nach «Erledigt» wird der nächste Termin automatisch berechnet und erscheint im Kalender, unter «Heute» und in den Hinweisen.",
        ],
        steps: [
          OPEN("«Wartungen»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Anlage, Servicefirma, Intervall, nächsten Termin und Zuständigen setzen.",
          },
          SAVE,
          CLOSE("Erledigt"),
        ],
        path: "/maintenances",
        keywords: ["wartung", "service", "intervall", "fällig", "nächster termin"],
      },
      {
        id: "inspections",
        title: "Kontrollen durchführen",
        summary: "Inklusive Notfall-Ausrüstung.",
        paragraphs: [
          "Kontrollen halten Zustand, Mängel und Maßnahmen fest. Die Arten reichen von Brandschutz, Notbeleuchtung, Fluchtwegen, Aufzug und Leitern bis zur «Notfall-Ausrüstung» - Defibrillator, Augendusche und Verbandkasten. Eigene Module gibt es zusätzlich für Brandschutz, Spielplätze, Legionellen und FI-Kontrollen.",
          "Jede Kontrolle trägt Intervall und nächstes Datum; der Termin erscheint im Kalender und wird erinnert. Mängel lassen sich mit einer Schaltfläche als Schaden oder Auftrag übernehmen, der Kontrollbericht steht als PDF bereit.",
          "Mit «Serie erfassen» wird eine Kontrolle für viele Räume, Gebäude oder Anlagen gleichzeitig angelegt.",
        ],
        steps: [
          OPEN("«Inspektionen»"),
          {
            title: "2. Erstellen",
            text: "«Neu» für eine einzelne Kontrolle oder «Serie erfassen» für viele Räume/Anlagen auf einmal.",
          },
          {
            title: "3. Bearbeiten",
            text: "Art wählen (z. B. «Notfall-Ausrüstung»), Datum, Kontrolleur, Intervall und Liegenschaft erfassen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Nach der Kontrolle das Ergebnis setzen - der nächste Termin wird automatisch eingetragen.",
          },
        ],
        path: "/inspections",
        keywords: [
          "kontrolle",
          "prüfung",
          "defibrillator",
          "augendusche",
          "verbandkasten",
          "notfall",
          "ausrüstung",
          "serie",
        ],
      },
      {
        id: "firesafety",
        title: "Brandschutz und Feuerungskontrolle",
        summary: "Feuerlöscher, Fluchtwege, Kaminfeger.",
        paragraphs: [
          "Das Brandschutzmodul kennt Feuerlöscher, Brandmeldeanlage, Fluchtwege, Notausgänge, Brandschutztüren, Rauchabzüge, Löschwasser, Beschilderung, individuelle Prüfungen und die Feuerungskontrolle des Kaminfegers (mit Brennstoff und Messwerten).",
          "Je Kontrollart ist ein Intervall vorbelegt; die nächste Kontrolle erscheint im Kalender und in den Hinweisen. Der Kontrollbericht steht als PDF bereit.",
        ],
        path: "/firesafety",
        keywords: ["brandschutz", "feuerlöscher", "kaminfeger", "feuerung", "fluchtweg"],
      },
      {
        id: "rcd",
        title: "FI-Kontrollen (RCD)",
        summary: "Elektrische Sicherheit nachweisen.",
        paragraphs: [
          "FI-Kontrollen erfassen Messwerte, Ergebnis und nächsten Termin je Anlage oder Stromkreis. Mängel lassen sich direkt als Auftrag übernehmen.",
        ],
        path: "/rcd",
        keywords: ["fi", "rcd", "elektro", "sicherheit", "messung"],
      },
      {
        id: "legionella",
        title: "Legionellenkontrollen",
        summary: "Trinkwasser prüfen.",
        paragraphs: [
          "Legionellenkontrollen erfassen Messstellen mit Warm- und Kaltwassertemperatur, Ergebnis und Ampel (ok, Warnung, kritisch). Der nächste Termin erscheint im Kalender.",
        ],
        path: "/legionella",
        keywords: ["legionellen", "wasser", "trinkwasser", "temperatur"],
      },
      {
        id: "playgrounds",
        title: "Spielplatzkontrollen",
        summary: "Sicht-, Funktions- und periodische Kontrolle.",
        paragraphs: [
          "Erfasst werden Spielplatz, Standort, Kontrollart, Datum, Kontrolleur, Zustand, Mängel, Fotos und Massnahmen. Die nächste Kontrolle wird aus dem Intervall berechnet, Mängel können als Schaden oder Auftrag übernommen werden.",
        ],
        path: "/playgrounds",
        keywords: ["spielplatz", "kinder", "kontrolle"],
      },
    ],
  },
  {
    id: "outdoor",
    title: "Aussenanlagen und Winterdienst",
    description: "Grünflächen, Pflanzen und Schneeräumung.",
    articles: [
      {
        id: "outdoor-areas",
        title: "Aussenanlagen verwalten",
        summary: "Grünflächen, Wege und Pflegearbeiten.",
        paragraphs: [
          "Aussenanlagen enthalten Grünflächen, Bäume, Hecken, Spielplätze, Wege und Bewässerung. Pflegeintervalle, Fotos, Schäden und Folgeaufträge bleiben mit der Anlage verknüpft. Der Menüpunkt steht direkt unter «Reinigungsaufgaben».",
        ],
        path: "/outdoor-areas",
        keywords: ["aussenanlagen", "grünfläche", "rasen", "hecke", "bewässerung"],
      },
      {
        id: "plants",
        title: "Pflanze erkennen",
        summary: "Foto machen - Google Lens nennt den Namen.",
        paragraphs: [
          "In jeder Aussenanlage steht oben die Karte «Pflanze erkennen». Der Weg: «1. Foto machen», dann «2. Foto an Google Lens senden» - im Teilen-Menü Google oder die Google-App wählen. Lens zeigt den Pflanzennamen.",
          "Auf dem iPhone geht es noch einfacher: das gespeicherte Foto lange gedrückt halten und «Pflanze bestimmen» wählen - der Name erscheint direkt.",
          "Den gefundenen Namen in der App eintragen und «Übernehmen» antippen; die Pflanze bleibt unter «Pflanzen / Arten» bei der Anlage gespeichert.",
        ],
        path: "/outdoor-areas",
        keywords: ["pflanze", "google lens", "erkennen", "foto", "art", "baum"],
      },
      {
        id: "winter",
        title: "Winterdienst",
        summary: "Schneeräumung und Glatteis dokumentieren.",
        paragraphs: [
          "Der Reiter «Winterdienst» in jeder Aussenanlage deckt den Winter ab: Einsatzgebiet, zuständige Person und Kontrollgang alle X Tage planen. Die Kontrollen erscheinen automatisch im Kalender und unter «Heute».",
          "Erfasst werden Kontrollgang, Schneeräumung und Glatteisbekämpfung mit Datum, Uhrzeit, Wetter, erledigten Arbeiten, Fotos und Bemerkungen. Streumittel kommt aus dem Lager und wird automatisch abgebucht.",
          "Mängel werden mit einem bestehenden Auftrag verknüpft oder direkt als neuer Auftrag erstellt. Die Einsatzhistorie zeigt alle Einsätze pro Standort.",
        ],
        path: "/outdoor-areas",
        keywords: [
          "winterdienst",
          "schnee",
          "glatteis",
          "streumittel",
          "schneeräumung",
          "salz",
        ],
      },
    ],
  },
  {
    id: "cleaning",
    title: "Reinigung",
    description: "Pläne, Aufgaben, Personal und Qualität.",
    articles: [
      {
        id: "cleaning",
        title: "Reinigung organisieren",
        summary: "Von der Fläche bis zur Kontrolle.",
        paragraphs: [
          "Zuerst werden Reinigungsbereiche (Flächen mit Quadratmetern und Bodenbelag) erfasst, dann Reinigungspläne mit Intervall und zuständiger Person. Daraus entstehen die Reinigungsaufgaben.",
          "Das Personal wird unter «Personal» gepflegt; jede Person sieht ihre eigenen Aufgaben. Reinigungskontrollen beurteilen die Qualität, Reklamationen halten Beanstandungen fest.",
        ],
        steps: [
          OPEN("«Reinigung»"),
          {
            title: "2. Erstellen",
            text: "Bereiche anlegen, danach einen Plan mit Intervall und Zuständigem erstellen.",
          },
          {
            title: "3. Bearbeiten",
            text: "Aufgaben prüfen, Personal zuweisen und Termine anpassen.",
          },
          SAVE,
          CLOSE("Erledigt"),
        ],
        path: "/cleaning",
        keywords: ["reinigung", "putzen", "plan", "personal", "reklamation", "kontrolle"],
      },
    ],
  },
  {
    id: "finance",
    title: "Rapporte, Rechnungen und Offerten",
    description: "Vom Rapport bis zur bezahlten Rechnung.",
    articles: [
      {
        id: "reports",
        title: "Rapporte und Arbeitszeiten",
        summary: "Geleistete Arbeit dokumentieren.",
        paragraphs: [
          "Im Rapport werden Datum, Mitarbeitende, Arbeitszeiten, Material und ausgeführte Arbeiten festgehalten. Der Rapport lässt sich als PDF erstellen und dem Kunden zustellen; die Stunden fliessen in Auswertung und Rechnungsstellung.",
          "Rapporte stehen im Menü unter «Administration».",
        ],
        path: "/reports",
        keywords: ["rapport", "stunden", "zeiterfassung", "pdf", "administration"],
      },
      {
        id: "invoices",
        title: "Rechnungen",
        summary: "Das eigene Rechnungstool.",
        paragraphs: [
          "Die Rechnungsseite arbeitet wie ein eigenes Rechnungssystem: Jahr und Monat wählen, filtern nach Status, Objekt, Lieferant und Kategorie, sortieren nach Datum, Fälligkeit, Betrag oder Lieferant und suchen nach Nummer und Inhalt.",
          "Oben stehen offene und überfällige Rechnungen prominent mit Summe; die Jahresübersicht zeigt Anzahl und Gesamtsumme. Die Stati sind Entwurf, Offen, Bezahlt, Überfällig und Storniert - eine versandte Rechnung nach der Fälligkeit zählt automatisch als überfällig.",
          "Beim Erfassen wird der Betrag direkt eingegeben, weitere Positionen folgen in der Rechnung. Der Reiter «PDF» zeigt die Rechnung mit QR-Einzahlungsschein; mit einem Tipp ist sie bezahlt. Rechnungen sind mit Kunde, Objekt, Auftrag, Offerte, Rapport und Lieferant verknüpft.",
        ],
        steps: [
          OPEN("«Administration» → «Rechnungen»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Kunde, Liegenschaft, Kategorie und Betrag (CHF) eintragen; bei Bedarf Auftrag und Rapport verknüpfen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "PDF mit QR-Einzahlungsschein erzeugen und nach Zahlungseingang «Bezahlt» setzen.",
          },
        ],
        path: "/invoices",
        keywords: ["rechnung", "faktura", "betrag", "bezahlt", "überfällig", "qr", "zahlung"],
      },
      {
        id: "quotes",
        title: "Offerten",
        summary: "Vom Angebot zur Rechnung.",
        paragraphs: [
          "Eine Offerte enthält Positionen mit Menge und Preis und kann als PDF verschickt werden. Wird sie angenommen, entsteht daraus eine Rechnung - ohne neue Erfassung.",
        ],
        path: "/quotes",
        keywords: ["offerte", "angebot", "preis", "mwst"],
      },
      {
        id: "analytics",
        title: "Berichte, Auswertungen und Audit",
        summary: "Zahlen für Kunden und Leitung.",
        paragraphs: [
          "Die Auswertungen zeigen Aufträge, Schäden, Kontrollen, Kosten und Reinigung je Zeitraum und Liegenschaft.",
          "Der Auditbericht weist die erfüllten Betreiberpflichten nach: Standort und Zeitraum wählen, die Ampel zeigt den Stand, und der Bericht steht als PDF bereit.",
        ],
        path: "/analytics",
        keywords: ["bericht", "auswertung", "statistik", "audit", "kennzahlen"],
      },
    ],
  },
  {
    id: "operations",
    title: "Betrieb und Partner",
    description: "Lieferanten, Lager, Fahrzeuge und mehr.",
    articles: [
      {
        id: "suppliers",
        title: "Lieferanten",
        summary: "Die zentrale Firmenliste.",
        paragraphs: [
          "Die Lieferantenliste führt Firmen mit Kategorie, Kontaktperson, Telefon, E-Mail, Adresse, Website, angebotenen Dienstleistungen, Notizen und Dokumenten. Suchen, Filtern (Kategorie, Status) und Sortieren sind eingebaut.",
          "Oben beim Lieferanten stehen die Direktaktionen: Anrufen, E-Mail, Website und Route. Mit «Archivieren» verschwindet ein Lieferant aus der aktiven Auswahl, ohne verloren zu gehen.",
          "Verknüpfungen zeigen Aufträge, Rechnungen, Wartungen, Objekte und Anlagen des Lieferanten. Doppelte Einträge werden anhand von Name, E-Mail und Telefonnummer erkannt und blockiert.",
        ],
        path: "/suppliers",
        keywords: ["lieferant", "firma", "anbieter", "kontakt", "anrufen", "archivieren"],
      },
      {
        id: "stock",
        title: "Lager und Inventar",
        summary: "Bestände, Werkzeuge und Material.",
        paragraphs: [
          "Das Lager führt Bestände mit Mindestmenge; Verbrauch - etwa Streumittel im Winterdienst - wird automatisch abgebucht. Inventar führt Gegenstände mit Standort, Anschaffung und Wert; Werkzeuge werden ausgeliehen und zurückgegeben.",
        ],
        path: "/stock",
        keywords: ["lager", "material", "inventar", "werkzeug", "bestand"],
      },
      {
        id: "fleet",
        title: "Fahrzeuge und Maschinen",
        summary: "Service, Kontrolle und Übergabe.",
        paragraphs: [
          "Fahrzeuge und Maschinen führen Kilometerstand oder Betriebsstunden, Wartungen, Reifen, Reparaturen, Treibstoff, Schäden, Berechtigungen und Übergaben.",
        ],
        path: "/vehicles",
        keywords: ["fahrzeug", "maschine", "service", "reifen", "übergabe"],
      },
      {
        id: "keys",
        title: "Schlüssel und Besucher",
        summary: "Wer hat was, wer war da.",
        paragraphs: [
          "Schlüssel werden mit Übergaben und Rückgaben protokolliert; Besucher und Parkplätze werden ebenfalls verwaltet. Der Abfallplan («Abfall») hält Entsorgungstermine fest.",
        ],
        path: "/keys",
        keywords: ["schlüssel", "besucher", "parking", "abfall", "übergabe"],
      },
      {
        id: "hazards",
        title: "Gefahrstoffkataster",
        summary: "Gefahrstoffe und Sicherheitsdatenblätter.",
        paragraphs: [
          "Gefahrstoffe werden Gebäude, Raum, Lagerort und verantwortlicher Person zugeordnet. Sicherheitsdatenblätter, Piktogramme, Schutzmassnahmen, Termine und QR-Zugriff bleiben am Eintrag.",
        ],
        path: "/hazards",
        keywords: ["gefahrstoff", "sicherheitsdatenblatt", "chemikalien", "qr"],
      },
      {
        id: "sources",
        title: "Bezugsquellen",
        summary: "Bewährte Anbieter sammeln.",
        paragraphs: [
          "Unter «Bezugsquellen» werden bewährte Anbieter mit Kategorie, Website, Kontakt, Bewertung und Notizen gesammelt - die Einkaufsliste der Firma.",
        ],
        path: "/sources",
        keywords: ["bezugsquelle", "einkauf", "anbieter", "quelle"],
      },
    ],
  },
  {
    id: "documents",
    title: "Dokumente und Verträge",
    description: "Unterlagen, Fristen und Garantien.",
    articles: [
      {
        id: "documents",
        title: "Dokumente, Verträge und Garantien",
        summary: "Ablage mit Ablaufwarnung.",
        paragraphs: [
          "Dokumente werden hochgeladen und einer Liegenschaft, einem Gebäude oder einer Anlage zugeordnet. Mit einem Ablaufdatum erinnert Facility365 rechtzeitig.",
          "Verträge führen Laufzeit, Kündigungsfrist, Kosten und Vertragspartner. Vor Ablauf oder Kündigungstermin erscheint ein Hinweis im Dashboard und im Kalender. Garantien werden bei der Anlage erfasst.",
        ],
        path: "/documents",
        keywords: ["dokument", "vertrag", "garantie", "ablauf", "kündigung", "frist"],
      },
    ],
  },
  {
    id: "energy",
    title: "Energie und Solar",
    description: "Verbrauch, Photovoltaik und Erträge.",
    articles: [
      {
        id: "energy",
        title: "Energie erfassen",
        summary: "Zählerstände und Verbrauch.",
        paragraphs: [
          "Unter «Energie» werden Verbrauchswerte je Liegenschaft und Gebäude erfasst (Strom, Wärme, Wasser). Die Übersicht zeigt Entwicklung und Vergleich über die Monate.",
        ],
        path: "/energy",
        keywords: ["energie", "strom", "wasser", "verbrauch", "zähler"],
      },
      {
        id: "solar",
        title: "Photovoltaik und Solarerträge",
        summary: "Anlage, Produktion, Eigenverbrauch, CO₂.",
        paragraphs: [
          "Unter «Photovoltaik» wird die Anlage erfasst: kWp, Inbetriebnahme, Wechselrichter, Speicher, Einspeisevergütung, Strompreis und CO₂-Faktor. Unter «Solarerträge» kommen die Monatswerte dazu: Produktion, Eigenverbrauch, Einspeisung, Erlöse und Kosten.",
          "Die Auswertung zeigt spezifischen Ertrag, Eigenverbrauchsquote, CO₂-Einsparung und den Vergleich mit dem Stromverbrauch derselben Liegenschaft.",
        ],
        path: "/solar",
        keywords: ["solar", "pv", "photovoltaik", "ertrag", "eigenverbrauch"],
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrationen",
    description: "Outlook, Microsoft 365 und Schnittstellen.",
    articles: [
      {
        id: "microsoft",
        title: "Outlook-Mails",
        summary: "Das Brief-Symbol oben in der Kopfzeile.",
        paragraphs: [
          "Das Brief-Symbol oben rechts - direkt neben dem QR-Scanner - öffnet die Outlook-Mails. Dort werden Betreff, Absender, Datum und Anhänge gezeigt.",
          "Jede Mail lässt sich einer Liegenschaft, einem Auftrag oder einer Rechnung zuordnen; verknüpfte Mails erscheinen dann im Reiter «E-Mails» beim Datensatz. Aus einer Mail entsteht mit einem Klick ein Auftrag - Betreff, Text und Anhänge werden übernommen.",
          "Die Anmeldung läuft über das Microsoft-365-Konto; in Facility365 wird kein Passwort gespeichert. Für die erste Einrichtung braucht es eine Registrierung bei Microsoft Entra mit Verzeichnis-ID und Anwendungs-ID.",
        ],
        path: "/microsoft",
        keywords: ["microsoft", "outlook", "mail", "e-mail", "entra", "brief"],
      },
      {
        id: "portal",
        title: "Kundenportal",
        summary: "Zugang für Kunden und Mieter.",
        paragraphs: [
          "Über das Portal sehen Kunden und Mieter ihre Liegenschaft, offene Arbeiten und Dokumente - ohne Zugang zur internen App.",
        ],
        path: "/portal",
        keywords: ["portal", "mieter", "kunde", "zugang"],
      },
      {
        id: "api",
        title: "Schnittstellen: API und Webhooks",
        summary: "Daten und Ereignisse an andere Systeme.",
        paragraphs: [
          "Fremdsysteme können Daten lesen über «GET /api/v1/<modul>?tenant=<organisation>» mit der Kopfzeile «x-api-key». Der Schlüssel wird serverseitig hinterlegt (FACILITY365_API_KEY), der Datenbankzugriff ebenfalls (SUPABASE_SERVICE_ROLE_KEY). Die Organisation ist Pflicht.",
          "Ereignisse werden als Webhook gemeldet: Erstellen, Ändern, Abschliessen, Löschen und Wiederherstellen mit Modul, Datensatz, Person, Zeitpunkt und geänderten Feldern. Die Empfängeradressen stehen in FACILITY365_WEBHOOK_URLS, das Geheimnis für die Signatur in FACILITY365_WEBHOOK_SECRET.",
          "Ohne hinterlegte Adressen bleibt alles unverändert - es werden keine Daten nach aussen gegeben.",
        ],
        path: "/settings",
        keywords: ["api", "webhook", "schnittstelle", "integration", "ereignis"],
      },
    ],
  },
  {
    id: "admin",
    title: "Benutzer und Administration",
    description: "Rollen, Rechte, Einstellungen und Papierkorb.",
    articles: [
      {
        id: "users",
        title: "Benutzer, Rollen und Rechte",
        summary: "Wer sieht und darf was.",
        paragraphs: [
          "Jede Person erhält eine Rolle: Superadmin und Organisationsadmin sehen alles, der Standortleiter seine Standorte, der Hauswart seine Arbeiten, die Reinigungskraft ihre Aufgaben, der Melder nur das Melden.",
          "Zusätzlich zur Rolle bestimmt der Benutzerdatensatz den Umfang: Organisation, zugewiesene Standorte und ob nur eigene Zuweisungen sichtbar sind. Der Reiter «Änderungen» zeigt die Historie.",
        ],
        path: "/users",
        keywords: ["benutzer", "rolle", "recht", "zugriff", "berechtigung"],
      },
      {
        id: "settings",
        title: "Einstellungen und einfacher Modus",
        summary: "Firma, Sprache, Module und Sicherung.",
        paragraphs: [
          "In den Einstellungen werden Firmenname, Logo, Sprache, Währung, Mehrwertsteuer und die sichtbaren Module gepflegt. Der «Einfache Modus» zeigt das Menü als flache Liste nur mit dem Wesentlichen - die Daten bleiben vollständig erhalten und kehren beim Ausschalten zurück.",
          "Hier stehen auch Mitteilungen (Push), die Sicherung und Wiederherstellung der Daten sowie «Beispiel-Daten laden».",
        ],
        path: "/settings",
        keywords: [
          "einstellungen",
          "sprache",
          "logo",
          "einfacher modus",
          "sicherung",
          "beispiel",
        ],
      },
      {
        id: "trash",
        title: "Papierkorb und Historie",
        summary: "Nichts geht verloren.",
        paragraphs: [
          "Gelöschte Einträge wandern in den Papierkorb und können dort wiederhergestellt werden. Endgültig entfernen darf nur, wer im Modul das Löschrecht hat.",
          "Jede Änderung steht im Reiter «Historie» des Datensatzes und in der Änderungshistorie unter Administration.",
        ],
        path: "/trash",
        keywords: ["papierkorb", "gelöscht", "wiederherstellen", "historie", "protokoll"],
      },
    ],
  },
  {
    id: "regelwerk",
    title: "Regelwerk und Normen",
    description: "Offizielle SUVA-Checklisten und Normen und wo sie in der App abgearbeitet werden.",
    articles: [
      {
        id: "suva-ladders",
        title: "Leitern und Tritte (SUVA 67028)",
        summary: "Die offizielle SUVA-Checkliste ist in der App hinterlegt.",
        paragraphs: [
          "Die SUVA-Checkliste 67028.d prueft, ob Leitern und Tritte sicher eingesetzt und gewartet werden: richtiges Arbeitsmittel, Aufstellen, Anstellwinkel, Spreizsicherung, Ueberstieg, Instandhaltung und Lagerung.",
          "In der App liegt die Liste fertig vor: Inspektionen → Neu → Art «Leitern und Tritte». Die nummerierten Fragen werden mit «ja / teilweise / nein» beantwortet, das Kontroll-PDF zeigt sie im SUVA-Format.",
        ],
        path: "/inspections",
        keywords: ["suva", "leiter", "tritt", "67028", "checkliste"],
      },
      {
        id: "suva-playground",
        title: "Spielplaetze (SN EN 1176-7)",
        summary: "Drei Kontrollstufen nach Norm - als Vorlage hinterlegt.",
        paragraphs: [
          "Spielplatzgeraete werden nach SN EN 1176-7 kontrolliert: die woechentliche Sichtkontrolle, die quartalsweise Funktionskontrolle und die jaehrliche Hauptkontrolle.",
          "Bei Spielplatzkontrollen → Neu wird die passende Liste je nach Kontrollart automatisch vorgefuellt - Fallzone, Einklemmstellen, Kanten, Verankerung, Korrosion und Beschilderung.",
        ],
        path: "/playgrounds",
        keywords: ["spielplatz", "en 1176", "suva", "kontrolle"],
      },
      {
        id: "rules-emergency",
        title: "Notfall- und Sicherheitsausruestung",
        summary: "Defibrillator, Augendusche, Feuerloescher und Fluchtwege regelmaessig pruefen.",
        paragraphs: [
          "Defibrillatoren, Augenduschen, Verbandkasten, Feuerloescher und Notbeleuchtung muessen regelmaessig kontrolliert werden; Feuerloescher folgen der SN EN 3 Reihe, Fluchtwege und Notbeleuchtung den VKF-Vorgaben.",
          "In der App: Inspektionen → Neu → Art «Notfall-Ausruestung», «Feuerloescher», «Notbeleuchtung» oder «Fluchtwege». Das Intervall legt das naechste Datum fest, die Erinnerung kommt automatisch.",
        ],
        path: "/inspections",
        keywords: ["defibrillator", "augendusche", "feuerloescher", "fluchtweg", "vkf", "en 3"],
      },
      {
        id: "rules-sources",
        title: "Wo die offiziellen Dokumente zu finden sind",
        summary: "Original-Merkblaetter und Normen im Netz.",
        paragraphs: [
          "SUVA-Merkblaetter gibt es kostenlos auf www.suva.ch - etwa 67028.d «Leitern und Tritte» und die Publikationen zu Spielplatzsicherheit. Die EN-Normen laufen ueber den Schweizerischen Normen-Verband (SNV, www.snv.ch), die VKF-Richtlinien ueber www.bsv-online.ch.",
          "Die in der App eingebauten Listen entsprechen diesen Quellen. Veraendert sich eine Norm, wird die Vorlage in der App angepasst - bereits erfasste Kontrollen bleiben unveraendert dokumentiert.",
        ],
        path: "/help",
        keywords: ["suva", "snv", "vkf", "norm", "merkblatt", "quelle"],
      },
    ],
  },
];

/** Alle Artikel als flache Liste - für Suche und Verlinkung. */
export const HELP_ARTICLES: (HelpArticle & {
  categoryId: string;
  categoryTitle: string;
})[] = HELP_CATEGORIES.flatMap((category) =>
  category.articles.map((article) => ({
    ...article,
    categoryId: category.id,
    categoryTitle: category.title,
  })),
);

/** Einfache Volltextsuche über Titel, Text, Schritte und Stichworte. */
export function searchHelp(query: string): typeof HELP_ARTICLES {
  const needle = query.trim().toLowerCase();
  if (!needle) return HELP_ARTICLES;
  return HELP_ARTICLES.filter((article) =>
    [
      article.title,
      article.summary,
      article.categoryTitle,
      ...article.paragraphs,
      ...(article.steps ?? []).flatMap((step) => [step.title, step.text]),
      ...(article.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}
