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
});
