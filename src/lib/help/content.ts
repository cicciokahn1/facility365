/**
 * Inhalte des Hilfe-Centers.
 *
 * Die Anleitung ist bewusst einfach geschrieben und richtet sich an neue
 * Mitarbeitende ohne Vorkenntnisse. Sie beschreibt nur bestehende Funktionen
 * und veraendert nichts an der Anwendung.
 */

export interface HelpStep {
  /** Kurzer Titel des Schritts, z. B. «Oeffnen». */
  title: string;
  text: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  summary: string;
  /** Erklaerender Text in kurzen Abschnitten. */
  paragraphs: string[];
  /** «So funktioniert es» - Schritt fuer Schritt. */
  steps?: HelpStep[];
  /** Seite in Facility365, die zum Thema gehoert. */
  path?: string;
  /** Zusaetzliche Suchbegriffe. */
  keywords?: string[];
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  articles: HelpArticle[];
}

const OPEN = (where: string): HelpStep => ({
  title: "1. Oeffnen",
  text: `Links in der Navigation ${where} waehlen. Auf dem Telefon zuerst auf «Mehr» tippen.`,
});

const CREATE: HelpStep = {
  title: "2. Erstellen",
  text: "Oben rechts auf «Neu» klicken. Das Formular oeffnet sich mit einer automatischen Nummer.",
};

const EDIT: HelpStep = {
  title: "3. Bearbeiten",
  text: "Pflichtfelder ausfuellen und die Zuordnung (Liegenschaft, Gebaeude, Raum, Anlage) setzen. Fotos und Dokumente koennen direkt angehaengt werden.",
};

const SAVE: HelpStep = {
  title: "4. Speichern",
  text: "Mit «Speichern» sichern. Der Eintrag erscheint sofort in der Liste, jede Aenderung wird in der Historie festgehalten.",
};

const CLOSE = (status: string): HelpStep => ({
  title: "5. Abschliessen",
  text: `Ist die Arbeit erledigt, den Status auf «${status}» setzen oder die Schaltflaeche «Erledigt» verwenden. Der Eintrag bleibt erhalten und ist ueber den Filter jederzeit wieder sichtbar.`,
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
        summary: "Ein System fuer den ganzen Gebaeudeunterhalt.",
        paragraphs: [
          "Facility365 ist die zentrale Arbeitsumgebung fuer Hauswartung, Technik, Reinigung und Verwaltung. Alle Objekte, Auftraege, Kontrollen, Dokumente und Kosten liegen an einem Ort statt in Listen, Mappen und Mails.",
          "Jede Person sieht nur, was zu ihrer Rolle und ihren Standorten gehoert. Nichts geht verloren: geloeschte Eintraege wandern in den Papierkorb, jede Aenderung steht in der Historie.",
          "Die App laeuft auf Computer, Tablet und Telefon. Auf dem Telefon kann sie wie eine App zum Startbildschirm hinzugefuegt werden.",
        ],
        keywords: ["einstieg", "ueberblick", "was ist"],
      },
      {
        id: "structure",
        title: "Wie ist die App aufgebaut?",
        summary: "Navigation, Listen und Detailansichten.",
        paragraphs: [
          "Zuoberst stehen Dashboard, Kalender und Heute. Darunter liegen die Hauptordner: Objekte, Technik & Instandhaltung, Auftraege & Rapporte, Reinigung, Energie, Betrieb, Dokumente & Vertraege, Finanzen, Auswertungen, Benutzer und Administration. Ein Ordner klappt erst auf, wenn er angetippt wird.",
          "Jedes Modul zeigt eine Liste mit Suche, Filtern und Sortierung. Erledigte Eintraege sind standardmaessig ausgeblendet; mit dem Filter «Alle» oder dem jeweiligen Status werden sie wieder angezeigt.",
          "Ein Klick auf einen Eintrag oeffnet die Detailansicht mit Reitern fuer Angaben, Fotos, Dokumente und Historie. Oben stehen die Aktionen wie Bearbeiten, Duplizieren, PDF oder Loeschen.",
          "Die Lupe oben rechts (oder Strg + K) durchsucht alle Module gleichzeitig.",
        ],
        keywords: ["navigation", "menu", "suche", "aufbau"],
      },
      {
        id: "hierarchy",
        title:
          "Organisation → Standort → Liegenschaft → Gebaeude → Raum → Anlage",
        summary: "Die Struktur, auf der alles aufbaut.",
        paragraphs: [
          "Die Organisation ist das Unternehmen oder die Verwaltung. Ein Standort fasst mehrere Liegenschaften zusammen (optional, z. B. eine Region oder ein Areal).",
          "Eine Liegenschaft ist die Adresse bzw. das Grundstueck. Dazu gehoeren ein oder mehrere Gebaeude, im Gebaeude liegen die Raeume, und im Raum stehen die Anlagen (Heizung, Lift, Lueftung, Beleuchtung usw.).",
          "Jeder Auftrag, Schaden, jede Kontrolle und Wartung wird dieser Struktur zugeordnet. Dadurch stimmen Auswertungen, Rechte und Kosten automatisch.",
        ],
        steps: [
          OPEN("den Ordner «Objekte»"),
          {
            title: "2. Erstellen",
            text: "Von oben nach unten anlegen: zuerst Liegenschaft, dann Gebaeude, dann Raeume, dann Anlagen.",
          },
          {
            title: "3. Bearbeiten",
            text: "Beim Gebaeude die Liegenschaft waehlen, beim Raum das Gebaeude, bei der Anlage den Raum. Die uebergeordnete Ebene wird dabei automatisch mitgefuehrt.",
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
          "gebaeude",
          "raum",
          "anlage",
        ],
      },
    ],
  },
  {
    id: "work",
    title: "Auftraege, Schaeden und Rapporte",
    description: "Die taegliche Arbeit erfassen und abschliessen.",
    articles: [
      {
        id: "orders",
        title: "Auftraege erstellen und bearbeiten",
        summary: "Vom neuen Auftrag bis zur Verrechnung.",
        paragraphs: [
          "Ein Auftrag beschreibt eine Arbeit mit Zustaendigem, Termin und Prioritaet. Der Status fuehrt durch die Bearbeitung: Offen, In Arbeit, Erledigt, Verrechnet.",
          "Zugewiesene Auftraege erscheinen bei der zustaendigen Person unter «Heute» und im Kalender. Fotos, Material und Arbeitszeiten koennen direkt im Auftrag erfasst werden.",
        ],
        steps: [
          OPEN("«Auftraege & Rapporte» → «Auftraege»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Titel, Beschreibung, Liegenschaft/Gebaeude/Raum/Anlage, Zustaendigen, Termin und Prioritaet setzen. Fotos direkt mit der Kamera aufnehmen.",
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
          "Im Helpdesk laufen alle Meldungen zusammen. Jedes Ticket erhaelt automatisch eine Nummer und traegt Kategorie, Prioritaet, Zuordnung (Kunde, Standort, Liegenschaft, Gebaeude, Raum, Anlage), Beschreibung, Fotos und eine zustaendige Person.",
          "Der Status fuehrt durch die Bearbeitung: Neu, In Bearbeitung, Wartet, Erledigt, Geschlossen. Mit einer Frist erinnert die App rechtzeitig; ueberfaellige Tickets stehen in einer eigenen Sicht. Erledigte und geschlossene Tickets sind standardmaessig ausgeblendet.",
          "Ein Ticket laesst sich mit einem Klick in einen Auftrag umwandeln; Titel, Ort, Anlage, Zustaendiger, Frist und Fotos werden uebernommen und beide bleiben verknuepft. Zusaetzlich koennen Schaden, Anlage, Wartung und Rapport verknuepft werden. Kommentare und Verlauf halten fest, wer wann was getan hat.",
        ],
        steps: [
          OPEN("«Auftraege & Rapporte» → «Helpdesk»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Kategorie und Prioritaet waehlen, Ort und Anlage zuordnen, Beschreibung und Fotos ergaenzen, zustaendige Person und Frist setzen.",
          },
          SAVE,
          CLOSE("Erledigt"),
        ],
        path: "/tickets",
        keywords: ["helpdesk", "ticket", "meldung", "support", "anfrage"],
      },
      {
        id: "damages",
        title: "Schaeden erfassen und weiterbearbeiten",
        summary: "Melden, beurteilen, beheben.",
        paragraphs: [
          "Ein Schaden haelt fest, was defekt ist, wo er sich befindet und wer ihn gemeldet hat. Aus einem Schaden kann mit einem Klick ein Auftrag entstehen; beide bleiben verknuepft.",
          "Am schnellsten geht es unterwegs: QR-Code der Anlage scannen, «Schaden melden» waehlen - Liegenschaft, Gebaeude, Raum und Anlage werden automatisch uebernommen. Es fehlen nur noch Beschreibung, Foto und Prioritaet.",
        ],
        steps: [
          OPEN("«Auftraege & Rapporte» → «Schaeden»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Ort und Anlage waehlen, Schaden beschreiben, Fotos anhaengen und die Prioritaet setzen.",
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
          "Im Rapport werden Datum, Mitarbeitende, Arbeitszeiten, Material und ausgefuehrte Arbeiten festgehalten. Der Rapport laesst sich als PDF erstellen und dem Kunden zustellen.",
          "Rapporte koennen mit Auftraegen verknuepft werden; die Stunden fliessen in die Auswertungen und in die Rechnungsstellung ein.",
        ],
        steps: [
          OPEN("«Auftraege & Rapporte» → «Rapporte»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Kunde, Liegenschaft, Datum, Arbeitszeit und ausgefuehrte Arbeiten erfassen, Material ergaenzen.",
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
        title: "Objektuebergabe",
        summary: "Uebergabe an eine andere Person dokumentieren.",
        paragraphs: [
          "Die Objektuebergabe fasst Anlagen, Schluessel, offene Arbeiten und Kontrollen einer Liegenschaft zusammen und erzeugt daraus einen Uebergabebericht als PDF.",
        ],
        path: "/handover",
        keywords: ["uebergabe", "stellvertretung"],
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
          "Eine Anlage gehoert zu einem Raum oder Gebaeude und fuehrt Typ, Hersteller, Baujahr, Seriennummer, Garantie, Wartungen, Dokumente und Fotos.",
          "Zu jeder Anlage gehoert ein QR-Code. Aufgeklebt am Geraet fuehrt er beim Scannen direkt zum Anlagenpass - mit Angaben, Historie und den Schaltflaechen «Schaden melden» und «Auftrag erstellen».",
        ],
        steps: [
          OPEN("«Technik & Instandhaltung» → «Anlagen»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Bezeichnung, Typ, Standort (Gebaeude/Raum), Hersteller, Seriennummer und Garantie erfassen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "QR-Code drucken und an der Anlage anbringen. Mit «Scannen» oeffnet sich die Anlage, mit «Scannen und Schaden melden» direkt die Meldung.",
          },
        ],
        path: "/assets",
        keywords: ["anlage", "geraet", "qr", "anlagenpass", "scannen"],
      },
      {
        id: "maintenances",
        title: "Wartungen verwalten",
        summary: "Wiederkehrende Arbeiten planen.",
        paragraphs: [
          "Eine Wartung gehoert zu einer Anlage und hat ein Intervall (z. B. jaehrlich). Nach dem Abschluss wird der naechste Termin automatisch berechnet und im Kalender angezeigt.",
          "Faellige Wartungen erscheinen im Dashboard, unter «Heute» und in den Hinweisen.",
        ],
        steps: [
          OPEN("«Technik & Instandhaltung» → «Wartungen»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Anlage, Servicefirma, Intervall, naechsten Termin und Zustaendigen setzen.",
          },
          SAVE,
          CLOSE("Erledigt"),
        ],
        path: "/maintenances",
        keywords: ["wartung", "service", "intervall", "faellig"],
      },
      {
        id: "inspections",
        title: "Kontrollen durchfuehren",
        summary: "Sicht-, Funktions- und periodische Kontrollen.",
        paragraphs: [
          "Kontrollen halten Zustand, Maengel und Massnahmen fest. Es gibt allgemeine Kontrollen sowie eigene Module fuer Brandschutz, Spielplaetze, Legionellen und FI-Kontrollen.",
          "Maengel lassen sich mit einer Schaltflaeche als Schaden oder Auftrag uebernehmen - die Kontrolle bleibt erhalten und wird verknuepft. Der Kontrollbericht kann als PDF erzeugt werden.",
          "Mit «Serie erfassen» wird eine Kontrolle fuer viele Raeume, Gebaeude oder Anlagen gleichzeitig angelegt: Liegenschaft waehlen, «Alle auswaehlen», Daten einmal ausfuellen.",
        ],
        steps: [
          OPEN("«Technik & Instandhaltung» → «Kontrollen»"),
          {
            title: "2. Erstellen",
            text: "«Neu» fuer eine einzelne Kontrolle oder «Serie erfassen» fuer viele Raeume/Anlagen auf einmal.",
          },
          {
            title: "3. Bearbeiten",
            text: "Kontrollart, Datum, Kontrolleur und Zustand erfassen, Maengel und Massnahmen beschreiben, Fotos anhaengen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Status auf «Erledigt» setzen, bei Bedarf Maengel als Schaden/Auftrag uebernehmen und den Kontrollbericht als PDF erstellen.",
          },
        ],
        path: "/inspections",
        keywords: ["kontrolle", "pruefung", "maengel", "serie"],
      },
      {
        id: "firesafety",
        title: "Brandschutz und Feuerungskontrolle",
        summary: "Feuerloescher, Fluchtwege, Kaminfeger.",
        paragraphs: [
          "Das Brandschutzmodul kennt Feuerloescher, Brandmeldeanlage, Fluchtwege, Notausgaenge, Brandschutztueren, Rauchabzuege, Loeschwasser, Beschilderung, individuelle Pruefungen und die Feuerungskontrolle des Kaminfegers (mit Brennstoff und Messwerten).",
          "Je Kontrollart ist ein Intervall vorbelegt; die naechste Kontrolle und die Frist erscheinen im Kalender und in den Hinweisen. Der Kontrollbericht steht als PDF bereit.",
        ],
        path: "/firesafety",
        keywords: ["brandschutz", "feuerloescher", "kaminfeger", "feuerung"],
      },
      {
        id: "playgrounds",
        title: "Spielplatzkontrollen",
        summary: "Sicht-, Funktions- und periodische Kontrolle.",
        paragraphs: [
          "Erfasst werden Spielplatz, Standort, Kontrollart, Datum, Kontrolleur, Zustand, Maengel, Fotos und Massnahmen. Die naechste Kontrolle wird aus dem Intervall berechnet, Maengel koennen als Schaden oder Auftrag uebernommen werden.",
        ],
        path: "/playgrounds",
        keywords: ["spielplatz", "kinder", "kontrolle"],
      },
    ],
  },
  {
    id: "cleaning",
    title: "Reinigung",
    description: "Plaene, Aufgaben, Personal und Qualitaet.",
    articles: [
      {
        id: "cleaning",
        title: "Reinigung organisieren",
        summary: "Von der Flaeche bis zur Kontrolle.",
        paragraphs: [
          "Zuerst werden Reinigungsbereiche (Flaechen mit Quadratmetern und Bodenbelag) erfasst, dann Reinigungsplaene mit Intervall und zustaendiger Person. Daraus entstehen die Reinigungsaufgaben.",
          "Das Reinigungspersonal wird unter «Personal» gepflegt; jede Person sieht ihre eigenen Aufgaben. Mit Reinigungskontrollen wird die Qualitaet beurteilt, Reklamationen halten Beanstandungen fest.",
        ],
        steps: [
          OPEN("den Ordner «Reinigung»"),
          {
            title: "2. Erstellen",
            text: "Bereiche anlegen, danach einen Plan mit Intervall und Zustaendigem erstellen.",
          },
          {
            title: "3. Bearbeiten",
            text: "Aufgaben pruefen, Personal zuweisen und Termine anpassen.",
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
    description: "Verbrauch, Photovoltaik und Ertraege.",
    articles: [
      {
        id: "energy",
        title: "Energie erfassen",
        summary: "Zaehlerstaende und Verbrauch.",
        paragraphs: [
          "Unter «Energie» werden Verbrauchswerte je Liegenschaft und Gebaeude erfasst (Strom, Waerme, Wasser). Die Uebersicht zeigt Entwicklung und Vergleich ueber die Monate.",
        ],
        path: "/energy",
        keywords: ["energie", "strom", "wasser", "verbrauch", "zaehler"],
      },
      {
        id: "solar",
        title: "Photovoltaik und Solarertraege",
        summary: "Anlage, Produktion, Eigenverbrauch, CO₂.",
        paragraphs: [
          "Unter «Photovoltaik» wird die Anlage erfasst: kWp, Inbetriebnahme, Wechselrichter, Speicher, Einspeiseverguetung, Strompreis und CO₂-Faktor. Unter «Solarertraege» kommen die Monatswerte dazu: Produktion, Eigenverbrauch, Einspeisung, Erloese und Kosten.",
          "Die Auswertung zeigt spezifischen Ertrag, Eigenverbrauchsquote, CO₂-Einsparung, Diagramme je Monat und den Vergleich mit dem Stromverbrauch derselben Liegenschaft.",
        ],
        steps: [
          OPEN("«Energie» → «Photovoltaik»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Anlagendaten erfassen und unter «Solarertraege» je Monat Produktion, Eigenverbrauch und Einspeisung eintragen.",
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
    description: "Inventar, Werkzeuge, Fahrzeuge, Schluessel und Lager.",
    articles: [
      {
        id: "operations",
        title: "Inventar, Werkzeuge, Fahrzeuge, Schluessel und Lager",
        summary: "Alles, was zum Betrieb gehoert.",
        paragraphs: [
          "Im Inventar stehen Gegenstaende mit Standort, Anschaffung und Wert; jede Position kann mit einem Lieferanten und einer Bezugsquelle verknuepft werden.",
          "Werkzeuge werden ausgeliehen und zurueckgegeben, Fahrzeuge fuehren Service, Pruefung und Kilometerstand, Schluessel werden mit Uebergaben und Rueckgaben protokolliert, das Lager fuehrt Bestaende mit Mindestmenge.",
          "Unter «Bezugsquellen» werden bewaehrte Anbieter mit Kategorie, Website, Kontakt, Bewertung und Notizen gesammelt.",
        ],
        path: "/inventory",
        keywords: [
          "inventar",
          "werkzeug",
          "fahrzeug",
          "schluessel",
          "lager",
          "bezugsquelle",
        ],
      },
    ],
  },
  {
    id: "documents",
    title: "Dokumente und Vertraege",
    description: "Unterlagen, Fristen und Garantien.",
    articles: [
      {
        id: "documents",
        title: "Dokumente, Vertraege und Garantien verwalten",
        summary: "Ablage mit Ablaufwarnung.",
        paragraphs: [
          "Dokumente werden hochgeladen und einer Liegenschaft, einem Gebaeude oder einer Anlage zugeordnet. Mit einem Ablaufdatum erinnert Facility365 rechtzeitig.",
          "Vertraege fuehren Laufzeit, Kuendigungsfrist, Kosten und Vertragspartner. Vor Ablauf oder Kuendigungstermin erscheint ein Hinweis im Dashboard und im Kalender.",
          "Garantien werden bei der Anlage erfasst; die Anlage zeigt, ob die Garantie noch laeuft.",
        ],
        steps: [
          OPEN("«Dokumente & Vertraege»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Datei hochladen, Titel und Zuordnung setzen, Ablauf- oder Kuendigungsdatum eintragen.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Vor Ablauf erscheint automatisch eine Erinnerung - nichts geht vergessen.",
          },
        ],
        path: "/documents",
        keywords: ["dokument", "vertrag", "garantie", "ablauf", "kuendigung"],
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
          "Der Kalender zeigt Auftraege, Wartungen, Kontrollen, Reinigung, Vertraege, Dokumente und Fahrzeugtermine zusammen. Zusaetzlich koennen eigene Termine direkt erstellt, bearbeitet und geloescht werden.",
          "Mit «Auswaehlen» lassen sich mehrere Termine markieren und gemeinsam aendern (Datum, Verschiebung um Tage, Zeiten, Ort, Verantwortlicher, Status).",
          "«Heute» zeigt jeder Person ihre faelligen und zugewiesenen Arbeiten fuer den Tag.",
        ],
        steps: [
          OPEN("«Kalender»"),
          {
            title: "2. Erstellen",
            text: "«Neuer Termin» waehlen und Titel, Datum, Zeit und Ort erfassen.",
          },
          {
            title: "3. Bearbeiten",
            text: "Termin antippen und aendern; mit «Auswaehlen» mehrere Termine gemeinsam bearbeiten.",
          },
          SAVE,
          {
            title: "5. Abschliessen",
            text: "Erledigte Termine auf «Erledigt» setzen; sie bleiben erhalten und sind ueber den Filter sichtbar.",
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
          "Ist die Verbindung eingerichtet, koennen Outlook-Mails als Auftrag uebernommen werden. Termine gleichen sich in beide Richtungen ab: Datum, Zeit und Ort bleiben auf beiden Seiten aktuell, geloescht wird nirgends.",
          "Die Einrichtung erfolgt unter Administration → Microsoft 365 mit Verzeichnis-ID und Anwendungs-ID der Entra-App.",
        ],
        path: "/microsoft",
        keywords: ["microsoft", "outlook", "mail", "synchronisation", "entra"],
      },
    ],
  },
  {
    id: "finance",
    title: "Finanzen und Auswertungen",
    description: "Offerten, Rechnungen, Kosten und Berichte.",
    articles: [
      {
        id: "finance",
        title: "Offerten, Rechnungen und Kosten",
        summary: "Vom Angebot bis zur Zahlung.",
        paragraphs: [
          "Eine Offerte enthaelt Positionen mit Menge und Preis und kann als PDF verschickt werden. Wird sie angenommen, entsteht daraus eine Rechnung.",
          "Rechnungen fuehren Faelligkeit und Zahlungsstatus; bezahlte Rechnungen sind standardmaessig ausgeblendet und ueber den Filter jederzeit sichtbar.",
        ],
        steps: [
          OPEN("«Finanzen» → «Offerten»"),
          CREATE,
          {
            title: "3. Bearbeiten",
            text: "Kunde waehlen, Positionen erfassen, Mehrwertsteuer pruefen.",
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
        summary: "Zahlen fuer Kunden und Leitung.",
        paragraphs: [
          "Die Auswertungen zeigen Auftraege, Schaeden, Kontrollen, Kosten und Reinigung je Zeitraum und Liegenschaft. Der Auditbericht weist die erfuellten Betreiberpflichten nach und laesst sich als PDF erstellen.",
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
          "Jede Person erhaelt eine Rolle: Superadmin und Organisationsadmin sehen alles, der Standortleiter seine Standorte, der Hauswart seine Arbeiten, die Reinigungskraft ihre Aufgaben, der Melder nur das Melden.",
          "Zusaetzlich zur Rolle bestimmt der Benutzerdatensatz den Umfang: Organisation, zugewiesene Standorte und ob nur eigene Zuweisungen sichtbar sind. Die Pruefung erfolgt nicht nur in der Navigation, sondern auch beim Zugriff auf die Daten.",
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
            text: "Nicht mehr taetige Personen deaktivieren statt loeschen - so bleiben ihre Eintraege nachvollziehbar.",
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
          "In den Einstellungen werden Firmenname, Logo, Sprache, Waehrung, Mehrwertsteuer und das Branchenpaket gepflegt. Ein Paket blendet nicht benoetigte Module aus - die Daten bleiben vollstaendig erhalten und kehren beim Einschalten zurueck.",
          "Erinnerungen zu faelligen Wartungen, Kontrollen, Vertraegen und Dokumenten erscheinen im Dashboard und als Hinweis. Sicherung und Wiederherstellung der Daten stehen ebenfalls in den Einstellungen.",
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
        id: "trash",
        title: "Papierkorb und Historie",
        summary: "Nichts geht verloren.",
        paragraphs: [
          "Geloeschte Eintraege wandern in den Papierkorb und koennen dort wiederhergestellt werden. Endgueltig entfernen darf nur, wer im Modul das Loeschrecht hat.",
          "Jede Aenderung steht im Reiter «Historie» des Datensatzes und in der Aenderungshistorie unter Administration.",
        ],
        path: "/trash",
        keywords: [
          "papierkorb",
          "geloescht",
          "wiederherstellen",
          "historie",
          "protokoll",
        ],
      },
    ],
  },
];

/** Alle Artikel als flache Liste - fuer Suche und Verlinkung. */
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

/** Einfache Volltextsuche ueber Titel, Text, Schritte und Stichworte. */
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
