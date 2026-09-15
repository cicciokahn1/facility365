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
