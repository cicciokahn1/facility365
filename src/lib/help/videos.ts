import type { Language } from '@/lib/i18n/dictionary';

/**
 * Hilfevideos «Facility365 in 2 Minuten».
 *
 * Jedes Video besteht aus Szenen mit echten Bildschirmen der App und einem
 * kurzen Untertitel. Die Szenen laufen automatisch ab; optional kann pro Video
 * eine echte Videodatei (`src`) hinterlegt werden, die dann statt der Szenen
 * abgespielt wird.
 */

export interface HelpVideoScene {
  /** Bild unter /public/help/video. */
  image: string;
  /** Kurzer Text, der zum Bild eingeblendet wird. */
  caption: string;
  /** Anzeigedauer in Sekunden. */
  seconds: number;
  /** Seite in Facility365, die zur Szene gehört. */
  path?: string;
}

export interface HelpVideo {
  id: string;
  title: string;
  summary: string;
  scenes: HelpVideoScene[];
  /** Optionale echte Videodatei (MP4/WebM). */
  src?: string;
  /** Vorschaubild zur Videodatei. */
  poster?: string;
  /** Länge der Videodatei in Sekunden. */
  durationSeconds?: number;
  /** Optionale Untertiteldateien je App-Sprache. */
  captions?: Partial<Record<Language, string>>;
}

const scene = (
  image: string,
  caption: string,
  seconds: number,
  path?: string,
): HelpVideoScene => ({ image: `/help/video/${image}.png`, caption, seconds, path });

export const HELP_INTRO_VIDEO: HelpVideo = {
  id: 'intro',
  title: 'Facility365 in 2 Minuten',
  summary: 'Vom Schaden bis zum erledigten Auftrag – ein kompletter Ablauf in der echten App.',
  src: '/help/video/facility365-in-2-minuten.mp4',
  poster: '/help/video/facility365-in-2-minuten.jpg',
  durationSeconds: 124,
  scenes: [
    scene(
      'dashboard',
      'Das Dashboard zeigt sofort, was heute wichtig ist: offene Aufträge, fällige Wartungen, Schäden und die grossen Schnellaktionen.',
      9,
      '/dashboard',
    ),
    scene(
      'today',
      '«Heute» listet alles, was heute oder überfällig ist. Antippen genügt, um eine Aufgabe zu öffnen.',
      8,
      '/today',
    ),
    scene(
      'damage-new',
      'Schaden melden: «Neuer Schaden» tippen, kurz beschreiben, Ort wählen – fertig.',
      9,
      '/damages?new=1',
    ),
    scene(
      'damage-detail',
      'Aus dem Schaden entsteht mit einem Klick ein Auftrag. Alles bleibt verknüpft.',
      8,
    ),
    scene(
      'order-detail',
      'Der Auftrag zeigt Kunde, Gebäude, Anlage und Zuständigkeit. Die wichtigsten Aktionen stehen oben: Erledigt, Fotos, Bearbeiten.',
      10,
      '/orders',
    ),
    scene(
      'photo',
      'Foto hinzufügen: direkt mit der Kamera aufnehmen. Das Bild hängt am Auftrag.',
      7,
      '/documents?new=1&photo=1',
    ),
    scene(
      'worktime',
      'Arbeitszeit erfassen: Von/Bis eintragen, Pause – die Stunden werden automatisch berechnet.',
      8,
      '/reports?new=1&workTime=1',
    ),
    scene(
      'reports',
      'Der Rapport übernimmt Arbeit, Material und Zeit. Er kann als PDF gedruckt oder verrechnet werden.',
      8,
      '/reports',
    ),
    scene(
      'maintenances',
      'Wartungen zeigen, was wann fällig ist. Durchführen, «Erledigt» tippen – der nächste Termin wird gesetzt.',
      9,
      '/maintenances',
    ),
    scene(
      'inspections',
      'Kontrollen funktionieren gleich: öffnen, prüfen, erledigen. Ergebnisse bleiben nachweisbar.',
      8,
      '/inspections',
    ),
    scene(
      'cleaning',
      'Reinigung: Aufgaben pro Raum und Tag. Reinigungskräfte sehen ihre Arbeit und haken sie ab.',
      8,
      '/cleaning/tasks',
    ),
    scene(
      'assets',
      'QR-Code: Jede Anlage und jeder Raum hat einen Code. Scannen öffnet den passenden Datensatz direkt vor Ort.',
      9,
      '/assets',
    ),
    scene(
      'order-detail',
      '«Erledigt» tippen – der Auftrag ist abgeschlossen, mit Foto, Zeit und Rapport dokumentiert. So einfach ist Facility365.',
      9,
    ),
  ],
};

export const HELP_SHORT_VIDEOS: HelpVideo[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    summary: 'Was heute wichtig ist – auf einen Blick.',
    scenes: [
      scene('dashboard', 'Oben: Heute, offene Aufträge, fällige Wartungen, Schäden. Darunter die grossen Schnellaktionen.', 9, '/dashboard'),
      scene('today', 'Mit «Heute» sieht jede Person nur, was jetzt zu tun ist.', 7, '/today'),
    ],
  },
  {
    id: 'damage',
    title: 'Schaden melden',
    summary: 'In drei Schritten erfasst.',
    scenes: [
      scene('damages', 'Unter «Schäden» stehen alle Meldungen mit Status und Priorität.', 6, '/damages'),
      scene('damage-new', '«Neu» tippen, Titel und Ort eintragen, Foto anhängen, speichern.', 9, '/damages?new=1'),
      scene('damage-detail', 'Aus dem Schaden wird mit einem Klick ein Auftrag erstellt.', 7),
    ],
  },
  {
    id: 'order',
    title: 'Auftrag bearbeiten und erledigen',
    summary: 'Öffnen, arbeiten, Erledigt.',
    scenes: [
      scene('orders', 'Die Auftragsliste zeigt Status, Fälligkeit und Zuständigkeit.', 6, '/orders'),
      scene('order-detail', 'Oben stehen die wichtigsten Aktionen: Erledigt, Rapport, Fotos, Bearbeiten.', 9),
      scene('worktime', 'Arbeitszeit direkt am Auftrag erfassen.', 6, '/reports?new=1&workTime=1'),
    ],
  },
  {
    id: 'maintenance',
    title: 'Wartung',
    summary: 'Fällige Wartungen durchführen.',
    scenes: [
      scene('maintenances', 'Fällige Wartungen erscheinen im Dashboard und in der Liste.', 7, '/maintenances'),
      scene('order-detail', 'Durchführen, «Erledigt» tippen – der nächste Termin wird automatisch gesetzt.', 8),
    ],
  },
  {
    id: 'inspection',
    title: 'Kontrolle',
    summary: 'Prüfen und nachweisen.',
    scenes: [
      scene('inspections', 'Kontrollen mit Intervall und nächstem Termin.', 7, '/inspections'),
      scene('dashboard', '«Kontrolle durchführen» startet direkt vom Dashboard.', 7, '/dashboard'),
    ],
  },
  {
    id: 'cleaning',
    title: 'Reinigung',
    summary: 'Aufgaben pro Raum und Tag.',
    scenes: [
      scene('cleaning', 'Reinigungsaufgaben mit Raum, Häufigkeit und Verantwortlichen. Erledigtes wird abgehakt.', 9, '/cleaning/tasks'),
    ],
  },
  {
    id: 'report',
    title: 'Rapport und Arbeitszeit',
    summary: 'Zeit erfassen, Rapport erstellen.',
    scenes: [
      scene('worktime', 'Arbeitszeit von/bis mit Pause – Stunden werden berechnet.', 7, '/reports?new=1&workTime=1'),
      scene('reports', 'Rapporte fassen Arbeit, Material und Zeit zusammen – als PDF oder zur Verrechnung.', 8, '/reports'),
    ],
  },
  {
    id: 'qr',
    title: 'QR-Code',
    summary: 'Scannen und direkt beim Datensatz sein.',
    scenes: [
      scene('assets', 'Jede Anlage und jeder Raum hat einen QR-Code (Aktion «QR» im Datensatz).', 7, '/assets'),
      scene('dashboard', 'Oben rechts scannen – der passende Datensatz öffnet sich sofort vor Ort.', 7, '/dashboard'),
    ],
  },
  {
    id: 'suppliers',
    title: 'Lieferanten',
    summary: 'Firmen finden, anrufen, verknüpfen.',
    scenes: [
      scene('suppliers', 'Die Lieferantenliste mit Suche, Kategorie-Filter und Sortierung.', 7, '/suppliers'),
      scene('supplier-detail', 'Oben stehen Anrufen, E-Mail, Website und Route; Tabs zeigen Aufträge, Rechnungen und Objekte.', 9),
      scene('supplier-detail', 'Doppelte Firmen werden erkannt und blockiert – die Liste bleibt sauber.', 6),
    ],
  },
  {
    id: 'invoices',
    title: 'Rechnungen',
    summary: 'Offene Posten im Griff.',
    scenes: [
      scene('invoices', 'Jahr und Monat wählen, nach Status, Objekt, Lieferant und Kategorie filtern.', 8, '/invoices'),
      scene('invoices', 'Offene und überfällige Rechnungen stehen prominent oben – mit Betrag und Anzahl.', 7),
      scene('invoices', 'Der Reiter «PDF» zeigt die Rechnung mit QR-Einzahlungsschein; ein Tipp setzt «Bezahlt».', 7),
    ],
  },
  {
    id: 'winter',
    title: 'Winterdienst',
    summary: 'Schneeräumung und Glatteis dokumentieren.',
    scenes: [
      scene('outdoor-detail', 'In der Aussenanlage steht der Reiter «Winterdienst» – mit Gebiet, Zuständigkeit und Intervall.', 8, '/outdoor-areas'),
      scene('winter', 'Kontrollgang, Schneeräumung oder Glatteis erfassen: Datum, Wetter, Arbeiten, Fotos.', 9),
      scene('winter', 'Streumittel wird automatisch aus dem Lager abgebucht; Mängel werden direkt zum Auftrag.', 7),
    ],
  },
  {
    id: 'plants',
    title: 'Pflanze erkennen',
    summary: 'Foto machen – Google Lens nennt den Namen.',
    scenes: [
      scene('outdoor-detail', 'In der Aussenanlage steht oben «Pflanze erkennen».', 7, '/outdoor-areas'),
      scene('outdoor-detail', '«1. Foto machen», dann «2. Foto an Google Lens senden» – Google nennt die Pflanze.', 9),
      scene('outdoor-detail', 'Namen eintragen, «Übernehmen» – die Pflanze bleibt bei der Anlage gespeichert.', 7),
    ],
  },
  {
    id: 'emergency-equipment',
    title: 'Notfall-Ausrüstung',
    summary: 'Defibrillator, Augendusche, Verbandkasten kontrollieren.',
    scenes: [
      scene('inspections', 'Inspektionen → «Neu» → Art «Notfall-Ausrüstung» wählen.', 8, '/inspections'),
      scene('inspections', 'Intervall und Liegenschaft eintragen – der nächste Termin erscheint im Kalender.', 8),
      scene('inspections', 'Nach der Kontrolle wird das nächste Datum automatisch gesetzt und erinnert.', 6),
    ],
  },
  {
    id: 'outlook',
    title: 'Outlook-Mails',
    summary: 'Das Brief-Symbol oben rechts.',
    scenes: [
      scene('dashboard', 'Oben rechts neben dem QR-Scanner: das Brief-Symbol öffnet die Mails.', 7, '/microsoft'),
      scene('microsoft', 'Mails laden, einer Liegenschaft, einem Auftrag oder einer Rechnung zuordnen.', 9),
      scene('microsoft', 'Mit einem Klick entsteht aus einer Mail direkt ein Auftrag.', 7),
    ],
  },
];

type VideoCopy = {
  title: string;
  summary: string;
  captions: string[];
};

const SHORT_VIDEO_COPY: Partial<Record<Language, Record<string, VideoCopy>>> = {
  fr: {
    dashboard: { title: 'Tableau de bord', summary: 'Ce qui est important aujourd’hui – en un coup d’œil.', captions: ['En haut : Aujourd’hui, les mandats ouverts, les entretiens dus et les dommages.', 'Avec « Aujourd’hui », chaque personne ne voit que ce qui doit être fait maintenant.'] },
    damage: { title: 'Signaler un dommage', summary: 'En trois étapes.', captions: ['Sous « Dommages », toutes les annonces apparaissent avec leur statut et leur priorité.', 'Appuyer sur « Nouveau », saisir le titre et le lieu, joindre une photo, enregistrer.', 'Le dommage devient un mandat en un clic.'] },
    order: { title: 'Traiter et terminer un mandat', summary: 'Ouvrir, travailler, terminer.', captions: ['La liste des mandats affiche le statut, l’échéance et la personne responsable.', 'Les actions principales sont en haut : Terminer, Rapport, Photos, Modifier.', 'Saisir directement le temps de travail dans le mandat.'] },
    maintenance: { title: 'Entretien', summary: 'Effectuer les entretiens dus.', captions: ['Les entretiens dus apparaissent sur le tableau de bord et dans la liste.', 'Effectuer le travail et appuyer sur « Terminé » – la prochaine date est créée.'] },
    inspection: { title: 'Contrôle', summary: 'Contrôler et prouver.', captions: ['Contrôles avec intervalle et prochaine date.', '« Effectuer un contrôle » démarre directement depuis le tableau de bord.'] },
    cleaning: { title: 'Nettoyage', summary: 'Tâches par pièce et par jour.', captions: ['Tâches de nettoyage avec pièce, fréquence et responsables. Les tâches terminées sont cochées.'] },
    report: { title: 'Rapport et temps de travail', summary: 'Saisir le temps et créer un rapport.', captions: ['Temps de travail de/à avec pause – les heures sont calculées.', 'Les rapports regroupent le travail, le matériel et le temps – en PDF ou pour la facturation.'] },
    qr: { title: 'Code QR', summary: 'Scanner et accéder directement à la fiche.', captions: ['Chaque installation et chaque pièce possède un code QR.', 'Scanner en haut à droite ouvre immédiatement la fiche correspondante.'] },
    suppliers: { title: 'Fournisseurs', summary: 'Trouver, appeler et lier des entreprises.', captions: ['La liste des fournisseurs avec recherche, filtre par catégorie et tri.', 'En haut : appeler, e-mail, site web et itinéraire ; les onglets montrent mandats, factures et objets.', 'Les doublons sont détectés et bloqués – la liste reste propre.'] },
    invoices: { title: 'Factures', summary: 'Garder les postes ouverts sous contrôle.', captions: ['Choisir année et mois, filtrer par statut, objet, fournisseur et catégorie.', 'Les factures ouvertes et échues sont affichées en évidence – avec montant et nombre.', 'L’onglet « PDF » affiche la facture avec bulletin de versement QR ; un appui la marque « Payée ».'] },
    winter: { title: 'Service d’hiver', summary: 'Documenter déneigement et verglas.', captions: ['Dans l’espace extérieur, l’onglet « Service d’hiver » – zone, responsable et intervalle.', 'Saisir ronde de contrôle, déneigement ou verglas : date, météo, travaux, photos.', 'Le produit de dégivrage est déduit du stock ; les défauts deviennent directement des mandats.'] },
    plants: { title: 'Identifier une plante', summary: 'Prendre une photo – Google Lens donne le nom.', captions: ['En haut de l’espace extérieur : « Identifier une plante ».', '« 1. Prendre une photo », puis « 2. Envoyer la photo à Google Lens » – Google nomme la plante.', 'Saisir le nom, appuyer sur « Reprendre » – la plante reste enregistrée.'] },
    'emergency-equipment': { title: 'Équipement d’urgence', summary: 'Contrôler défibrillateur, douche oculaire et trousse de secours.', captions: ['Contrôles → « Nouveau » → choisir le type « Équipement d’urgence ».', 'Saisir intervalle et bien – la prochaine date apparaît au calendrier.', 'Après le contrôle, la prochaine date est définie automatiquement.'] },
    outlook: { title: 'E-mails Outlook', summary: 'L’icône d’enveloppe en haut à droite.', captions: ['En haut à droite, à côté du scanner QR : l’enveloppe ouvre les e-mails.', 'Charger les e-mails et les lier à un bien, un mandat ou une facture.', 'Un clic transforme un e-mail en mandat.'] },
  },
  it: {
    dashboard: { title: 'Dashboard', summary: 'Ciò che è importante oggi – a colpo d’occhio.', captions: ['In alto: Oggi, ordini aperti, manutenzioni in scadenza e segnalazioni.', 'Con «Oggi» ogni persona vede solo ciò che deve fare adesso.'] },
    damage: { title: 'Segnalare un danno', summary: 'In tre passaggi.', captions: ['In «Danni» sono visibili tutte le segnalazioni con stato e priorità.', 'Toccare «Nuovo», inserire titolo e luogo, allegare una foto e salvare.', 'Con un tocco il danno diventa un ordine.'] },
    order: { title: 'Gestire e chiudere un ordine', summary: 'Aprire, lavorare, completare.', captions: ['L’elenco mostra stato, scadenza e responsabile.', 'Le azioni principali sono in alto: Completa, Rapporto, Foto, Modifica.', 'Registrare direttamente il tempo di lavoro nell’ordine.'] },
    maintenance: { title: 'Manutenzione', summary: 'Eseguire le manutenzioni in scadenza.', captions: ['Le manutenzioni in scadenza compaiono nel dashboard e nell’elenco.', 'Eseguire il lavoro e toccare «Completato» – viene impostata la prossima data.'] },
    inspection: { title: 'Controllo', summary: 'Controllare e documentare.', captions: ['Controlli con intervallo e prossima data.', '«Esegui controllo» avvia direttamente il controllo dal dashboard.'] },
    cleaning: { title: 'Pulizia', summary: 'Attività per locale e giorno.', captions: ['Attività di pulizia con locale, frequenza e responsabili. Le attività concluse vengono spuntate.'] },
    report: { title: 'Rapporto e tempo di lavoro', summary: 'Registrare il tempo e creare un rapporto.', captions: ['Tempo di lavoro da/a con pausa – le ore vengono calcolate.', 'I rapporti riuniscono lavoro, materiale e tempo – come PDF o per la fatturazione.'] },
    qr: { title: 'Codice QR', summary: 'Scansionare e aprire subito la scheda.', captions: ['Ogni impianto e ogni locale ha un codice QR.', 'La scansione in alto a destra apre subito la scheda corretta.'] },
    suppliers: { title: 'Fornitori', summary: 'Trovare, chiamare e collegare le aziende.', captions: ['La lista dei fornitori con ricerca, filtro per categoria e ordinamento.', 'In alto: chiama, e-mail, sito web e percorso; le schede mostrano ordini, fatture e oggetti.', 'I duplicati vengono riconosciuti e bloccati – la lista resta pulita.'] },
    invoices: { title: 'Fatture', summary: 'Tenere sotto controllo le partite aperte.', captions: ['Scegliere anno e mese, filtrare per stato, oggetto, fornitore e categoria.', 'Le fatture aperte e scadute sono in evidenza – con importo e numero.', 'La scheda «PDF» mostra la fattura con polizza QR; un tocco la segna «Pagata».'] },
    winter: { title: 'Servizio invernale', summary: 'Documentare sgombero neve e ghiaccio.', captions: ['Nell’area esterna la scheda «Servizio invernale» – zona, responsabile e intervallo.', 'Registrare controllo, sgombero neve o ghiaccio: data, meteo, lavori, foto.', 'Il materiale antighiaccio viene scalato dal magazzino; i difetti diventano ordini.'] },
    plants: { title: 'Riconoscere una pianta', summary: 'Fare una foto – Google Lens dice il nome.', captions: ['In alto nell’area esterna: «Riconoscere una pianta».', '«1. Fare una foto», poi «2. Inviare la foto a Google Lens» – Google indica la pianta.', 'Inserire il nome, toccare «Applica» – la pianta resta salvata.'] },
    'emergency-equipment': { title: 'Attrezzatura di emergenza', summary: 'Controllare defibrillatore, doccia oculare e cassetta di pronto soccorso.', captions: ['Controlli → «Nuovo» → scegliere il tipo «Attrezzatura di emergenza».', 'Inserire intervallo e oggetto – la prossima data appare nel calendario.', 'Dopo il controllo, la prossima data viene impostata automaticamente.'] },
    outlook: { title: 'E-mail Outlook', summary: 'L’icona della busta in alto a destra.', captions: ['In alto a destra, accanto allo scanner QR: la busta apre le e-mail.', 'Caricare le e-mail e collegarle a un oggetto, un ordine o una fattura.', 'Con un tocco l’e-mail diventa un ordine.'] },
  },
  en: {
    dashboard: { title: 'Dashboard', summary: 'What matters today – at a glance.', captions: ['At the top: Today, open orders, due maintenance and reported damage.', 'Today shows each person only what needs to be done now.'] },
    damage: { title: 'Report damage', summary: 'Done in three steps.', captions: ['Damage shows all reports with their status and priority.', 'Tap New, enter the title and location, add a photo and save.', 'Turn the damage report into an order with one tap.'] },
    order: { title: 'Work on and complete an order', summary: 'Open, work, complete.', captions: ['The order list shows status, due date and responsibility.', 'The key actions are at the top: Complete, Report, Photos, Edit.', 'Record working time directly in the order.'] },
    maintenance: { title: 'Maintenance', summary: 'Carry out due maintenance.', captions: ['Due maintenance appears on the dashboard and in the list.', 'Do the work and tap Complete – the next date is set automatically.'] },
    inspection: { title: 'Inspection', summary: 'Check and document.', captions: ['Inspections with intervals and the next due date.', 'Start an inspection directly from the dashboard.'] },
    cleaning: { title: 'Cleaning', summary: 'Tasks by room and day.', captions: ['Cleaning tasks show room, frequency and responsibility. Completed tasks are checked off.'] },
    report: { title: 'Report and working time', summary: 'Record time and create a report.', captions: ['Working time from/to with a break – hours are calculated automatically.', 'Reports combine work, materials and time – as a PDF or for billing.'] },
    qr: { title: 'QR code', summary: 'Scan and open the record directly.', captions: ['Every asset and room has a QR code.', 'Scan at the top right to open the matching record immediately.'] },
    suppliers: { title: 'Suppliers', summary: 'Find, call and link companies.', captions: ['The supplier list with search, category filter and sorting.', 'At the top: call, e-mail, website and directions; tabs show orders, invoices and sites.', 'Duplicates are detected and blocked – the list stays clean.'] },
    invoices: { title: 'Invoices', summary: 'Keep open items under control.', captions: ['Pick year and month, filter by status, site, supplier and category.', 'Open and overdue invoices are highlighted at the top – with amount and count.', 'The “PDF” tab shows the invoice with the QR payment slip; one tap marks it paid.'] },
    winter: { title: 'Winter service', summary: 'Document snow clearing and ice control.', captions: ['In the outdoor area, the “Winter service” tab – zone, person responsible and interval.', 'Record inspection round, snow clearing or gritting: date, weather, work done, photos.', 'Gritting material is deducted from stock automatically; defects become orders directly.'] },
    plants: { title: 'Identify a plant', summary: 'Take a photo – Google Lens names it.', captions: ['At the top of the outdoor area: “Identify plant”.', '“1. Take a photo”, then “2. Send photo to Google Lens” – Google names the plant.', 'Enter the name, tap “Apply” – the plant stays saved with the area.'] },
    'emergency-equipment': { title: 'Emergency equipment', summary: 'Check defibrillator, eye wash and first-aid kit.', captions: ['Inspections → “New” → choose the type “Emergency equipment”.', 'Set interval and site – the next date appears in the calendar.', 'After the check, the next date is set automatically.'] },
    outlook: { title: 'Outlook mail', summary: 'The envelope icon top right.', captions: ['Top right next to the QR scanner: the envelope opens the mail.', 'Load mail and assign it to a site, an order or an invoice.', 'One tap turns an e-mail into an order.'] },
  },
};

export const helpShortVideosFor = (language: Language): HelpVideo[] => {
  const copies = SHORT_VIDEO_COPY[language];
  if (!copies) return HELP_SHORT_VIDEOS;
  return HELP_SHORT_VIDEOS.map((video) => {
    const copy = copies[video.id];
    if (!copy) return video;
    return {
      ...video,
      title: copy.title,
      summary: copy.summary,
      scenes: video.scenes.map((item, index) => ({
        ...item,
        caption: copy.captions[index] ?? item.caption,
      })),
    };
  });
};

const INTRO_COPY: Partial<Record<Language, Pick<HelpVideo, 'title' | 'summary'>>> = {
  fr: {
    title: 'Facility365 en 2 minutes',
    summary: 'Du dommage au mandat terminé – un parcours complet dans l’application.',
  },
  it: {
    title: 'Facility365 in 2 minuti',
    summary: 'Dal danno all’ordine completato – un flusso completo nell’app.',
  },
  en: {
    title: 'Facility365 in 2 minutes',
    summary: 'From damage report to completed order – a complete workflow in the real app.',
  },
};

export const helpIntroFor = (language: Language): HelpVideo => ({
  ...HELP_INTRO_VIDEO,
  ...(INTRO_COPY[language] ?? {}),
  captions: {
    de: '/help/video/captions/de.vtt',
    fr: '/help/video/captions/fr.vtt',
    it: '/help/video/captions/it.vtt',
    en: '/help/video/captions/en.vtt',
  },
});
