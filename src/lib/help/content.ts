/**
 * Inhalte des Hilfe-Centers.
 *
 * Die Anleitung ist bewusst einfach geschrieben und richtet sich an neue
 * Mitarbeitende ohne Vorkenntnisse. Sie beschreibt nur bestehende Funktionen
 * und verändert nichts an der Anwendung.
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
  text: `Links in der Navigation ${where} wählen. Auf dem Telefon zuerst auf «Mehr» tippen.`,
});

const CREATE: HelpStep = {
  title: "2. Erstellen",
  text: "Oben rechts auf «Neu» klicken. Das Formular öffnet sich mit einer automatischen Nummer.",
};

const EDIT: HelpStep = {
  title: "3. Bearbeiten",
  text: "Pflichtfelder ausfüllen und die Zuordnung (Liegenschaft, Gebäude, Raum, Anlage) setzen. Fotos und Dokumente können direkt angehängt werden.",
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
          "Facility365 ist die zentrale Arbeitsumgebung für Hauswartung, Technik, Reinigung und Verwaltung. Alle Objekte, Aufträge, Kontrollen, Dokumente und Kosten liegen an einem Ort statt in Listen, Mappen und Mails.",
          "Jede Person sieht nur, was zu ihrer Rolle und ihren Standorten gehört. Nichts geht verloren: gelöschte Einträge wandern in den Papierkorb, jede Änderung steht in der Historie.",
          "Die App läuft auf Computer, Tablet und Telefon. Auf dem Telefon kann sie wie eine App zum Startbildschirm hinzugefügt werden.",
        ],
        keywords: ["einstieg", "überblick", "was ist"],
      },
      {
        id: "structure",
        title: "Wie ist die App aufgebaut?",
        summary: "Navigation, Listen und Detailansichten.",
        paragraphs: [
          "Zuoberst stehen Dashboard, Kalender und Heute. Darunter liegen die Hauptordner: Objekte, Technik & Instandhaltung, Aufträge & Rapporte, Reinigung, Energie, Betrieb, Dokumente & Verträge, Auswertungen, Benutzer und Administration. Ein Ordner klappt erst auf, wenn er angetippt wird.",
          "Jedes Modul zeigt eine Liste mit Suche, Filtern und Sortierung. Erledigte Einträge sind standardmässig ausgeblendet; mit dem Filter «Alle» oder dem jeweiligen Status werden sie wieder angezeigt.",
          "Ein Klick auf einen Eintrag öffnet die Detailansicht mit Reitern für Angaben, Fotos, Dokumente und Historie. Oben stehen die Aktionen wie Bearbeiten, Duplizieren, PDF oder Löschen.",
          "Die Lupe oben rechts (oder Strg + K) durchsucht alle Module gleichzeitig.",
        ],
        keywords: ["navigation", "menu", "suche", "aufbau"],
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
          OPEN("den Ordner «Objekte»"),
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
        id: "plans",
        title: "Gebäudepläne, Flächen und Arbeitsplätze",
        summary: "Pläne nutzen, Räume und Anlagen darauf setzen.",
        paragraphs: [
          "Zu jedem Gebäude und jeder Liegenschaft lassen sich Pläne hinterlegen (Bild oder PDF), je Stockwerk und mit Fassungen - eine neue Fassung ersetzt die alte nicht, sondern legt sich darüber.",
          "Auf Bildplänen können Räume und Anlagen als Markierung gesetzt, verschoben, bearbeitet und wieder entfernt werden. Ein Klick auf die Markierung führt direkt zum Raum oder zur Anlage; umgekehrt zeigt der Reiter «Pläne» beim Raum und bei der Anlage, auf welchem Plan sie stehen.",
          "Flächen werden beim Gebäude, beim Stockwerk und beim Raum erfasst; beim Raum zusätzlich die Anzahl Arbeitsplätze und die Nutzung bzw. Abteilung. Der Reiter «Flächen» beim Gebäude und bei der Liegenschaft wertet das aus: Gesamtfläche, Fläche je Stockwerk und je Raumart, Anzahl Arbeitsplätze und die Räume, bei denen die Fläche noch fehlt.",
        ],
        steps: [
          OPEN("ein Gebäude → Reiter «Pläne»"),
          {
            title: "2. Erstellen",
            text: "Plan hochladen, Titel und Stockwerk wählen.",
          },
          {
            title: "3. Bearbeiten",
            text: "Plan öffnen, Markierung setzen, auf die Stelle klicken und Raum oder Anlage zuordnen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Im Reiter «Flächen» prüfen, ob bei allen Räumen Fläche und Arbeitsplätze erfasst sind.",
          },
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
    ],
  },
  {
    id: "work",
    title: "Aufträge, Schäden und Rapporte",
    description: "Die tägliche Arbeit erfassen und abschliessen.",
    articles: [
      {
        id: "orders",
        title: "Aufträge erstellen und bearbeiten",
        summary: "Vom neuen Auftrag bis zur Verrechnung.",
        paragraphs: [
          "Ein Auftrag beschreibt eine Arbeit mit Zuständigem, Termin und Priorität. Der Status führt durch die Bearbeitung: Offen, In Arbeit, Erledigt, Verrechnet.",
          "Zugewiesene Aufträge erscheinen bei der zuständigen Person unter «Heute» und im Kalender. Fotos, Material und Arbeitszeiten können direkt im Auftrag erfasst werden.",
        ],
        steps: [
          OPEN("«Aufträge & Rapporte» → «Aufträge»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Titel, Beschreibung, Liegenschaft/Gebäude/Raum/Anlage, Zuständigen, Termin und Priorität setzen. Fotos direkt mit der Kamera aufnehmen.",
          },
          SAVE,
          CLOSE("Erledigt"),
        ],
        path: "/orders",
        keywords: ["auftrag", "arbeit", "aufgabe", "ticket"],
      },
      {
        id: "tickets",
        title: "Helpdesk: Meldungen und Tickets",
        summary: "Meldungen zentral annehmen, zuweisen und abschliessen.",
        paragraphs: [
          "Im Helpdesk laufen alle Meldungen zusammen. Jedes Ticket erhält automatisch eine Nummer und trägt Kategorie, Priorität, Zuordnung (Kunde, Standort, Liegenschaft, Gebäude, Raum, Anlage), Beschreibung, Fotos und eine zuständige Person.",
          "Der Status führt durch die Bearbeitung: Neu, In Bearbeitung, Wartet, Erledigt, Geschlossen. Mit einer Frist erinnert die App rechtzeitig; überfällige Tickets stehen in einer eigenen Sicht. Erledigte und geschlossene Tickets sind standardmässig ausgeblendet.",
          "Ein Ticket lässt sich mit einem Klick in einen Auftrag umwandeln; Titel, Ort, Anlage, Zuständiger, Frist und Fotos werden übernommen und beide bleiben verknüpft. Zusätzlich können Schaden, Anlage, Wartung und Rapport verknüpft werden. Kommentare und Verlauf halten fest, wer wann was getan hat.",
        ],
        steps: [
          OPEN("«Aufträge & Rapporte» → «Helpdesk»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Kategorie und Priorität wählen, Ort und Anlage zuordnen, Beschreibung und Fotos ergänzen, zuständige Person und Frist setzen.",
          },
          SAVE,
          CLOSE("Erledigt"),
        ],
        path: "/tickets",
        keywords: ["helpdesk", "ticket", "meldung", "support", "anfrage"],
      },
      {
        id: "damages",
        title: "Schäden erfassen und weiterbearbeiten",
        summary: "Melden, beurteilen, beheben.",
        paragraphs: [
          "Ein Schaden hält fest, was defekt ist, wo er sich befindet und wer ihn gemeldet hat. Aus einem Schaden kann mit einem Klick ein Auftrag entstehen; beide bleiben verknüpft.",
          "Am schnellsten geht es unterwegs: QR-Code der Anlage scannen, «Schaden melden» wählen - Liegenschaft, Gebäude, Raum und Anlage werden automatisch übernommen. Es fehlen nur noch Beschreibung, Foto und Priorität.",
        ],
        steps: [
          OPEN("«Aufträge & Rapporte» → «Schäden»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Ort und Anlage wählen, Schaden beschreiben, Fotos anhängen und die Priorität setzen.",
          },
          SAVE,
          CLOSE("Behoben"),
        ],
        path: "/damages",
        keywords: ["schaden", "defekt", "meldung", "qr"],
      },
      {
        id: "reports",
        title: "Rapporte und Arbeitszeiten",
        summary: "Geleistete Arbeit dokumentieren.",
        paragraphs: [
          "Im Rapport werden Datum, Mitarbeitende, Arbeitszeiten, Material und ausgeführte Arbeiten festgehalten. Der Rapport lässt sich als PDF erstellen und dem Kunden zustellen.",
          "Rapporte können mit Aufträgen verknüpft werden; die Stunden fliessen in die Auswertungen und in die Rechnungsstellung ein.",
        ],
        steps: [
          OPEN("«Aufträge & Rapporte» → «Rapporte»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Kunde, Liegenschaft, Datum, Arbeitszeit und ausgeführte Arbeiten erfassen, Material ergänzen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Status auf «Final» setzen und mit «PDF» den Rapport erzeugen.",
          },
        ],
        path: "/reports",
        keywords: ["rapport", "stunden", "zeiterfassung", "pdf"],
      },
      {
        id: "handover",
        title: "Objektübergabe",
        summary: "Übergabe an eine andere Person dokumentieren.",
        paragraphs: [
          "Die Objektübergabe fasst Anlagen, Schlüssel, offene Arbeiten und Kontrollen einer Liegenschaft zusammen und erzeugt daraus einen Übergabebericht als PDF.",
        ],
        path: "/handover",
        keywords: ["übergabe", "stellvertretung"],
      },
    ],
  },
  {
    id: "technics",
    title: "Technik, Wartung und Kontrollen",
    description: "Anlagen betreiben und Betreiberpflichten nachweisen.",
    articles: [
      {
        id: "assets",
        title: "Anlagen und QR-Codes verwenden",
        summary: "Jede Anlage mit Pass und Code.",
        paragraphs: [
          "Eine Anlage gehört zu einem Raum oder Gebäude und führt Typ, Hersteller, Baujahr, Seriennummer, Garantie, Wartungen, Dokumente und Fotos.",
          "Zu jeder Anlage gehört ein QR-Code. Aufgeklebt am Gerät führt er beim Scannen direkt zum Anlagenpass - mit Angaben, Historie und den Schaltflächen «Schaden melden» und «Auftrag erstellen».",
        ],
        steps: [
          OPEN("«Technik & Instandhaltung» → «Anlagen»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Bezeichnung, Typ, Standort (Gebäude/Raum), Hersteller, Seriennummer und Garantie erfassen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "QR-Code drucken und an der Anlage anbringen. Mit «Scannen» öffnet sich die Anlage, mit «Scannen und Schaden melden» direkt die Meldung.",
          },
        ],
        path: "/assets",
        keywords: ["anlage", "gerät", "qr", "anlagenpass", "scannen"],
      },
      {
        id: "maintenances",
        title: "Wartungen verwalten",
        summary: "Wiederkehrende Arbeiten planen.",
        paragraphs: [
          "Eine Wartung gehört zu einer Anlage und hat ein Intervall (z. B. jährlich). Nach dem Abschluss wird der nächste Termin automatisch berechnet und im Kalender angezeigt.",
          "Fällige Wartungen erscheinen im Dashboard, unter «Heute» und in den Hinweisen.",
        ],
        steps: [
          OPEN("«Technik & Instandhaltung» → «Wartungen»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Anlage, Servicefirma, Intervall, nächsten Termin und Zuständigen setzen.",
          },
          SAVE,
          CLOSE("Erledigt"),
        ],
        path: "/maintenances",
        keywords: ["wartung", "service", "intervall", "fällig"],
      },
      {
        id: "inspections",
        title: "Kontrollen durchführen",
        summary: "Sicht-, Funktions- und periodische Kontrollen.",
        paragraphs: [
          "Kontrollen halten Zustand, Mängel und Maßnahmen fest. Es gibt allgemeine Kontrollen sowie eigene Module für Brandschutz, Spielplätze, Legionellen und FI-Kontrollen.",
          "Mängel lassen sich mit einer Schaltfläche als Schaden oder Auftrag übernehmen - die Kontrolle bleibt erhalten und wird verknüpft. Der Kontrollbericht kann als PDF erzeugt werden.",
          "Mit «Serie erfassen» wird eine Kontrolle für viele Räume, Gebäude oder Anlagen gleichzeitig angelegt: Liegenschaft wählen, «Alle auswählen», Daten einmal ausfüllen.",
        ],
        steps: [
          OPEN("«Technik & Instandhaltung» → «Kontrollen»"),
          {
            title: "2. Erstellen",
            text: "«Neu» für eine einzelne Kontrolle oder «Serie erfassen» für viele Räume/Anlagen auf einmal.",
          },
          {
            title: "3. Bearbeiten",
            text: "Kontrollart, Datum, Kontrolleur und Zustand erfassen, Mängel und Maßnahmen beschreiben, Fotos anhängen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Status auf «Erledigt» setzen, bei Bedarf Mängel als Schaden/Auftrag übernehmen und den Kontrollbericht als PDF erstellen.",
          },
        ],
        path: "/inspections",
        keywords: ["kontrolle", "prüfung", "mängel", "serie"],
      },
      {
        id: "firesafety",
        title: "Brandschutz und Feuerungskontrolle",
        summary: "Feuerlöscher, Fluchtwege, Kaminfeger.",
        paragraphs: [
          "Das Brandschutzmodul kennt Feuerlöscher, Brandmeldeanlage, Fluchtwege, Notausgänge, Brandschutztüren, Rauchabzüge, Löschwasser, Beschilderung, individuelle Prüfungen und die Feuerungskontrolle des Kaminfegers (mit Brennstoff und Messwerten).",
          "Je Kontrollart ist ein Intervall vorbelegt; die nächste Kontrolle und die Frist erscheinen im Kalender und in den Hinweisen. Der Kontrollbericht steht als PDF bereit.",
        ],
        path: "/firesafety",
        keywords: ["brandschutz", "feuerlöscher", "kaminfeger", "feuerung"],
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
          "Das Reinigungspersonal wird unter «Personal» gepflegt; jede Person sieht ihre eigenen Aufgaben. Mit Reinigungskontrollen wird die Qualität beurteilt, Reklamationen halten Beanstandungen fest.",
        ],
        steps: [
          OPEN("den Ordner «Reinigung»"),
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
        keywords: ["reinigung", "putzen", "plan", "personal", "reklamation"],
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
          "Die Auswertung zeigt spezifischen Ertrag, Eigenverbrauchsquote, CO₂-Einsparung, Diagramme je Monat und den Vergleich mit dem Stromverbrauch derselben Liegenschaft.",
        ],
        steps: [
          OPEN("«Energie» → «Photovoltaik»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Anlagendaten erfassen und unter «Solarerträge» je Monat Produktion, Eigenverbrauch und Einspeisung eintragen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Auswertung mit Jahr und Anlage filtern und die Kennzahlen ablesen.",
          },
        ],
        path: "/solar",
        keywords: ["solar", "pv", "photovoltaik", "ertrag", "eigenverbrauch"],
      },
    ],
  },
  {
    id: "operations",
    title: "Betrieb",
    description: "Inventar, Werkzeuge, Fahrzeuge, Schlüssel und Lager.",
    articles: [
      {
        id: "operations",
        title: "Inventar, Werkzeuge, Fahrzeuge, Schlüssel und Lager",
        summary: "Alles, was zum Betrieb gehört.",
        paragraphs: [
          "Im Inventar stehen Gegenstände mit Standort, Anschaffung und Wert; jede Position kann mit einem Lieferanten und einer Bezugsquelle verknüpft werden.",
          "Werkzeuge werden ausgeliehen und zurückgegeben, Fahrzeuge führen Service, Prüfung und Kilometerstand, Schlüssel werden mit Übergaben und Rückgaben protokolliert, das Lager führt Bestände mit Mindestmenge.",
          "Unter «Bezugsquellen» werden bewährte Anbieter mit Kategorie, Website, Kontakt, Bewertung und Notizen gesammelt.",
        ],
        path: "/inventory",
        keywords: [
          "inventar",
          "werkzeug",
          "fahrzeug",
          "schlüssel",
          "lager",
          "bezugsquelle",
        ],
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
        title: "Dokumente, Verträge und Garantien verwalten",
        summary: "Ablage mit Ablaufwarnung.",
        paragraphs: [
          "Dokumente werden hochgeladen und einer Liegenschaft, einem Gebäude oder einer Anlage zugeordnet. Mit einem Ablaufdatum erinnert Facility365 rechtzeitig.",
          "Verträge führen Laufzeit, Kündigungsfrist, Kosten und Vertragspartner. Vor Ablauf oder Kündigungstermin erscheint ein Hinweis im Dashboard und im Kalender.",
          "Garantien werden bei der Anlage erfasst; die Anlage zeigt, ob die Garantie noch läuft.",
        ],
        steps: [
          OPEN("«Dokumente & Verträge»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Datei hochladen, Titel und Zuordnung setzen, Ablauf- oder Kündigungsdatum eintragen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Vor Ablauf erscheint automatisch eine Erinnerung - nichts geht vergessen.",
          },
        ],
        path: "/documents",
        keywords: ["dokument", "vertrag", "garantie", "ablauf", "kündigung"],
      },
    ],
  },
  {
    id: "planning",
    title: "Kalender und Aufgaben",
    description: "Termine, Heute-Liste und Erinnerungen.",
    articles: [
      {
        id: "calendar",
        title: "Kalender und Aufgaben",
        summary: "Alle Termine an einem Ort.",
        paragraphs: [
          "Der Kalender zeigt Aufträge, Wartungen, Kontrollen, Reinigung, Verträge, Dokumente und Fahrzeugtermine zusammen. Zusätzlich können eigene Termine direkt erstellt, bearbeitet und gelöscht werden.",
          "Mit «Auswählen» lassen sich mehrere Termine markieren und gemeinsam ändern (Datum, Verschiebung um Tage, Zeiten, Ort, Verantwortlicher, Status).",
          "«Heute» zeigt jeder Person ihre fälligen und zugewiesenen Arbeiten für den Tag.",
        ],
        steps: [
          OPEN("«Kalender»"),
          {
            title: "2. Erstellen",
            text: "«Neuer Termin» wählen und Titel, Datum, Zeit und Ort erfassen.",
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
        keywords: ["kalender", "termin", "heute", "aufgaben", "ics"],
      },
      {
        id: "microsoft",
        title: "Microsoft 365 und Outlook",
        summary: "Mails als Auftrag, Termine in beide Richtungen.",
        paragraphs: [
          "Ist die Verbindung eingerichtet, können Outlook-Mails als Auftrag übernommen werden. Termine gleichen sich in beide Richtungen ab: Datum, Zeit und Ort bleiben auf beiden Seiten aktuell, gelöscht wird nirgends.",
          "Die Einrichtung erfolgt unter Administration → Microsoft 365 mit Verzeichnis-ID und Anwendungs-ID der Entra-App.",
        ],
        path: "/microsoft",
        keywords: ["microsoft", "outlook", "mail", "synchronisation", "entra"],
      },
    ],
  },
  {
    id: "finance",
    title: "Rechnungen und Auswertungen",
    description: "Offerten, Rechnungen, Kosten und Berichte.",
    articles: [
      {
        id: "finance",
        title: "Offerten, Rechnungen und Kosten",
        summary: "Vom Angebot bis zur Zahlung.",
        paragraphs: [
          "Eine Offerte enthält Positionen mit Menge und Preis und kann als PDF verschickt werden. Wird sie angenommen, entsteht daraus eine Rechnung.",
          "Rechnungen führen Fälligkeit und Zahlungsstatus; bezahlte Rechnungen sind standardmässig ausgeblendet und über den Filter jederzeit sichtbar.",
        ],
        steps: [
          OPEN("«Dokumente & Verträge» → «Offerten»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Kunde wählen, Positionen erfassen, Mehrwertsteuer prüfen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "PDF erstellen, Status auf «Angenommen» setzen und die Rechnung erzeugen.",
          },
        ],
        path: "/quotes",
        keywords: ["offerte", "rechnung", "kosten", "preis", "mwst"],
      },
      {
        id: "analytics",
        title: "Berichte und Auswertungen",
        summary: "Zahlen für Kunden und Leitung.",
        paragraphs: [
          "Die Auswertungen zeigen Aufträge, Schäden, Kontrollen, Kosten und Reinigung je Zeitraum und Liegenschaft. Der Auditbericht weist die erfüllten Betreiberpflichten nach und lässt sich als PDF erstellen.",
        ],
        path: "/analytics",
        keywords: ["bericht", "auswertung", "statistik", "audit", "kennzahlen"],
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
          "Zusätzlich zur Rolle bestimmt der Benutzerdatensatz den Umfang: Organisation, zugewiesene Standorte und ob nur eigene Zuweisungen sichtbar sind. Die Prüfung erfolgt nicht nur in der Navigation, sondern auch beim Zugriff auf die Daten.",
        ],
        steps: [
          OPEN("«Benutzer»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Name, E-Mail, Rolle, Organisation und Standorte setzen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Nicht mehr tätige Personen deaktivieren statt löschen - so bleiben ihre Einträge nachvollziehbar.",
          },
        ],
        path: "/users",
        keywords: ["benutzer", "rolle", "recht", "zugriff", "berechtigung"],
      },
      {
        id: "settings",
        title: "Einstellungen und Benachrichtigungen",
        summary: "Firma, Sprache, Branche, Hinweise.",
        paragraphs: [
          "In den Einstellungen werden Firmenname, Logo, Sprache, Währung, Mehrwertsteuer und das Branchenpaket gepflegt. Ein Paket blendet nicht benötigte Module aus - die Daten bleiben vollständig erhalten und kehren beim Einschalten zurück.",
          "Erinnerungen zu fälligen Wartungen, Kontrollen, Verträgen und Dokumenten erscheinen im Dashboard und als Hinweis. Sicherung und Wiederherstellung der Daten stehen ebenfalls in den Einstellungen.",
        ],
        path: "/settings",
        keywords: [
          "einstellungen",
          "sprache",
          "logo",
          "benachrichtigung",
          "paket",
          "sicherung",
        ],
      },
      {
        id: "api",
        title: "Schnittstellen: API und Webhooks",
        summary: "Daten und Ereignisse an andere Systeme.",
        paragraphs: [
          "Fremdsysteme können Daten lesen über «GET /api/v1/<modul>?tenant=<organisation>» mit der Kopfzeile «x-api-key». Der Schlüssel wird serverseitig hinterlegt (FACILITY365_API_KEY), der Datenbankzugriff ebenfalls (SUPABASE_SERVICE_ROLE_KEY). Die Organisation ist Pflicht: es werden nie Daten mehrerer Mandanten zusammen geliefert.",
          "Ereignisse werden als Webhook gemeldet: Erstellen, Ändern, Abschliessen, Löschen und Wiederherstellen (record.created, record.updated, record.completed, record.deleted, record.restored) mit Modul, Datensatz, Person, Zeitpunkt und geänderten Feldern. Die Empfängeradressen stehen in FACILITY365_WEBHOOK_URLS, das Geheimnis für die Signatur in FACILITY365_WEBHOOK_SECRET; jede Meldung trägt die Kopfzeile «x-facility365-signature» (HMAC SHA-256).",
          "Ohne hinterlegte Adressen bleibt alles unverändert - es werden keine Daten nach aussen gegeben.",
        ],
        path: "/settings",
        keywords: [
          "api",
          "webhook",
          "schnittstelle",
          "integration",
          "ereignis",
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
        keywords: [
          "papierkorb",
          "gelöscht",
          "wiederherstellen",
          "historie",
          "protokoll",
        ],
      },
    ],
  },
  {
    id: "new-tools",
    title: "Neue Werkzeuge",
    description: "Die neuesten einfachen Wege für Hauswarte.",
    articles: [
      {
        id: "today-filters",
        title: "Heute: Alle, Überfällig und Heute",
        summary: "Aufgaben schneller finden.",
        paragraphs: [
          "Die Heute-Seite zeigt die persönliche Arbeit, fällige Aufgaben und kommende Termine. Mit den Filtern «Alle», «Überfällig» und «Heute» wird die Liste sofort kleiner.",
        ],
        steps: [
          OPEN("«Heute»"),
          { title: "2. Filter wählen", text: "«Überfällig» für dringende Aufgaben oder «Heute» für den aktuellen Arbeitstag antippen." },
          { title: "3. Direkt arbeiten", text: "Auftrag öffnen, «In Arbeit» setzen, Foto hinzufügen oder «Erledigt» verwenden." },
        ],
        path: "/today",
        keywords: ["heute", "überfällig", "filter", "aufgaben", "hauswart"],
      },
      {
        id: "inspection-folder",
        title: "Hauswart-Prüfmappe",
        summary: "Prüfbereiche ohne Umwege öffnen.",
        paragraphs: [
          "Im Rundgang bündelt die Prüfmappe die bestehenden Bereiche für Anlagen, Brandschutz, Kontrollen und Aussenanlagen. Die Erfassung bleibt in den jeweiligen Modulen und wird nicht doppelt angelegt.",
        ],
        steps: [
          OPEN("«Rundgang»"),
          { title: "2. Bereich wählen", text: "In der Prüfmappe Anlagen, Brandschutz, Kontrollen oder Aussenanlagen öffnen." },
          { title: "3. Mangel weiterführen", text: "Bei einer Abweichung Foto und Bemerkung erfassen und direkt einen Schaden, Auftrag oder eine Wartung erstellen." },
        ],
        path: "/walkthrough",
        keywords: ["prüfmappe", "rundgang", "brandschutz", "kontrolle", "aussenanlagen"],
      },
      {
        id: "outdoor-areas",
        title: "Aussenanlagen verwalten",
        summary: "Grünflächen, Wege und Pflegearbeiten dokumentieren.",
        paragraphs: [
          "Aussenanlagen enthalten Grünflächen, Bäume, Hecken, Spielplätze, Wege und Bewässerung. Pflegeintervalle, Fotos, Schäden und Folgeaufträge bleiben mit der Anlage verknüpft.",
        ],
        path: "/outdoor-areas",
        keywords: ["aussenanlagen", "grünfläche", "rasen", "winterdienst", "bewässerung"],
      },
      {
        id: "hazards",
        title: "Gefahrstoffkataster",
        summary: "Gefahrstoffe und Sicherheitsdatenblätter schnell finden.",
        paragraphs: [
          "Gefahrstoffe werden Gebäude, Raum, Lagerort und verantwortlicher Person zugeordnet. Sicherheitsdatenblätter, Piktogramme, Schutzmassnahmen, Termine und QR-Zugriff bleiben am Eintrag.",
        ],
        path: "/hazards",
        keywords: ["gefahrstoff", "sicherheitsdatenblatt", "chemikalien", "qr"],
      },
      {
        id: "fleet",
        title: "Fahrzeuge und Maschinen",
        summary: "Service, Kontrolle und Übergabe an einem Ort.",
        paragraphs: [
          "Fahrzeuge und Maschinen führen Kilometerstand oder Betriebsstunden, Wartungen, Reifen, Reparaturen, Treibstoff, Schäden, Berechtigungen und Übergaben.",
        ],
        path: "/vehicles",
        keywords: ["fahrzeug", "maschine", "service", "reifen", "übergabe"],
      },
      {
        id: "private-area",
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
