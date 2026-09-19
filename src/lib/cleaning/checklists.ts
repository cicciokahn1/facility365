import { ChecklistItem } from '@/lib/types';
import type { Language } from '@/lib/i18n/dictionary';
import { newId } from '@/lib/utils/id';

const CHECKLISTS: Record<string, string[]> = {
  sanitary: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'WC reinigen',
    'WC-Sitz reinigen',
    'Waschbecken reinigen',
    'Armaturen reinigen',
    'Spiegel reinigen',
    'Türgriffe reinigen',
    'Abfall leeren',
    'Toilettenpapier auffüllen',
    'Seife auffüllen',
    'Boden reinigen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  sanitaryDeep: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Grobe Verschmutzungen entfernen',
    'WC-Schüssel und Sitz gründlich reinigen',
    'Fliesen, Fugen und Ablauf reinigen',
    'Armaturen und Spiegel reinigen',
    'Desinfizieren, falls vorgesehen',
    'Boden gründlich reinigen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  office: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Abfall leeren',
    'Papierkorb kontrollieren',
    'Oberflächen reinigen',
    'Tische reinigen',
    'Griffbereiche reinigen',
    'Boden reinigen',
    'Sichtbare Verschmutzungen entfernen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  room: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Abfall leeren',
    'Oberflächen und Kontaktbereiche reinigen',
    'Bett und Einrichtung kontrollieren',
    'Boden reinigen',
    'Verbrauchsmaterial auffüllen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  careRoom: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Abfall gemäss Vorgabe entfernen',
    'Kontaktflächen reinigen und desinfizieren',
    'Sanitärbereich reinigen',
    'Boden reinigen',
    'Verbrauchsmaterial auffüllen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  bathroom: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Grobe Verschmutzungen entfernen',
    'Dusche, Bad und Waschbecken reinigen',
    'Armaturen und Spiegel reinigen',
    'Boden reinigen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  stairway: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Handläufe reinigen',
    'Treppen reinigen',
    'Podeste reinigen',
    'Abfall entfernen',
    'Spinnweben entfernen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  corridor: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Boden reinigen',
    'Wände und Griffbereiche kontrollieren',
    'Abfall entfernen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  kitchen: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Grobe Verschmutzungen entfernen',
    'Arbeitsflächen reinigen',
    'Spüle und Armaturen reinigen',
    'Abfall leeren',
    'Boden reinigen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  deep: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Grobe Verschmutzungen entfernen',
    'Oberflächen und Kontaktbereiche gründlich reinigen',
    'Ecken, Kanten und schwer zugängliche Stellen reinigen',
    'Boden gründlich reinigen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  disinfection: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Grobe Verschmutzungen entfernen',
    'Kontaktflächen reinigen',
    'Desinfektionsmittel nach Herstellerangaben dosieren',
    'Einwirkzeit einhalten',
    'Raum ausreichend lüften',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  waste: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Abfall sortieren und sicher entfernen',
    'Behälter reinigen und neue Säcke einsetzen',
    'Boden und Umfeld reinigen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  floor: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Warnschild aufstellen',
    'Grobe Verschmutzungen entfernen',
    'Boden trocken reinigen',
    'Boden feucht wischen',
    'Ecken, Kanten und schwer zugängliche Stellen reinigen',
    'Boden trocknen lassen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  scrubber: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Maschine und Akku kontrollieren',
    'Warnschild aufstellen',
    'Reinigungsfläche frei räumen',
    'Staubwischen oder Trockensaugen',
    'Unter den Möbeln mit dem Flachmopp reinigen',
    'Reinigungsmittel nach Herstellerangaben dosieren',
    'Mit der Maschine den Rändern entlang scheuern',
    'Fläche in überlappenden Bahnen scheuern',
    'Reinigungslösung einwirken lassen',
    'Randbereiche manuell nachreinigen',
    'Fläche in überlappenden Bahnen scheuersaugen',
    'Wasser ausschalten und Maschine in den Reinigungsraum fahren',
    'Schmutzwasser entleeren',
    'Maschine reinigen und laden',
    'Warnschild versorgen',
    'Boden trocknen lassen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
  window: [
    'Vorbereitung und Material bereitstellen',
    'PSA anziehen',
    'Rahmen reinigen',
    'Fensterbank reinigen',
    'Glas innen reinigen',
    'Glas aussen reinigen',
    'Griff reinigen',
    'Umgebung sauber hinterlassen',
    'Arbeitsplatz sauber verlassen',
    'Sichtkontrolle',
  ],
};

export const checklistTemplateFor = (type: string): ChecklistItem[] =>
  (CHECKLISTS[type] ?? ['Oberflächen reinigen', 'Boden reinigen', 'Abfall entfernen', 'Sichtkontrolle']).map(
    (text) => ({ id: newId('chk'), text, done: false }),
  );

export const checklistFor = (items: ChecklistItem[] | undefined, type: string): ChecklistItem[] =>
  items && items.length > 0 ? items : checklistTemplateFor(type);

/** Reinigungsarten mit eigener Vorlage (Arbeitsanleitung). */
export const CLEANING_TEMPLATE_TYPES: string[] = Object.keys(CHECKLISTS);

/** Arbeitsphase eines Schritts: Vorarbeit, Hauptarbeit, Schlussarbeit, Endkontrolle. */
export type CleaningPhase = 'prep' | 'main' | 'finish' | 'review';

const PREP_STEPS = new Set([
  'vorbereitung und material bereitstellen',
  'psa anziehen',
  'warnschild aufstellen',
  'maschine und akku kontrollieren',
]);
const FINISH_STEPS = new Set([
  'toilettenpapier auffüllen',
  'seife auffüllen',
  'verbrauchsmaterial auffüllen',
  'schmutzwasser entleeren',
  'maschine reinigen und laden',
  'wasser ausschalten und maschine in den reinigungsraum fahren',
  'warnschild versorgen',
  'boden trocknen lassen',
  'raum ausreichend lüften',
  'umgebung sauber hinterlassen',
  'arbeitsplatz sauber verlassen',
]);
const REVIEW_STEPS = new Set(['sichtkontrolle', 'papierkorb kontrollieren']);

export const phaseOf = (text: string | undefined): CleaningPhase => {
  const key = (text ?? '').trim().toLocaleLowerCase('de-CH');
  if (PREP_STEPS.has(key)) return 'prep';
  if (FINISH_STEPS.has(key)) return 'finish';
  if (REVIEW_STEPS.has(key)) return 'review';
  return 'main';
};

export const PHASE_ORDER: CleaningPhase[] = ['prep', 'main', 'finish', 'review'];

export const phaseLabel = (phase: CleaningPhase, language: Language): string => {
  const labels: Record<CleaningPhase, Record<Language, string>> = {
    prep: { de: 'Vorarbeit', fr: 'Préparation', it: 'Preparazione', en: 'Preparation' },
    main: { de: 'Hauptarbeit', fr: 'Travail principal', it: 'Lavoro principale', en: 'Main work' },
    finish: { de: 'Schlussarbeit', fr: 'Travaux finaux', it: 'Lavori finali', en: 'Finishing' },
    review: { de: 'Blick zurück / Endkontrolle', fr: 'Contrôle final', it: 'Controllo finale', en: 'Final check' },
  };
  return labels[phase][language];
};

/** Persönliche Schutzausrüstung nur passend zur Reinigungsart. */
export interface CleaningPpeItem {
  icon: string;
  label: string;
}

export const ppeFor = (type: string, language: Language): CleaningPpeItem[] => {
  const gloves: Record<Language, string> = { de: 'Schutzhandschuhe', fr: 'Gants de protection', it: 'Guanti protettivi', en: 'Protective gloves' };
  const shoes: Record<Language, string> = { de: 'Rutschfeste Schuhe', fr: 'Chaussures antidérapantes', it: 'Scarpe antiscivolo', en: 'Non-slip shoes' };
  const eyes: Record<Language, string> = { de: 'Augenschutz bei Spritzgefahr', fr: 'Protection oculaire en cas de projections', it: 'Protezione occhi in caso di schizzi', en: 'Eye protection where splashes are possible' };
  const clothing: Record<Language, string> = { de: 'Arbeitskleidung', fr: 'Vêtements de travail', it: 'Abbigliamento da lavoro', en: 'Work clothing' };
  const safetyShoes: Record<Language, string> = { de: 'Sicherheitsschuhe', fr: 'Chaussures de sécurité', it: 'Scarpe di sicurezza', en: 'Safety shoes' };
  const items: CleaningPpeItem[] = [{ icon: 'H', label: gloves[language] }];
  if (['disinfection', 'sanitaryDeep', 'deep', 'kitchen', 'scrubber'].includes(type)) {
    items.push({ icon: 'A', label: eyes[language] });
  }
  if (['scrubber', 'waste', 'garage', 'outdoor'].includes(type)) {
    items.push({ icon: 'S', label: safetyShoes[language] });
  } else {
    items.push({ icon: 'S', label: shoes[language] });
  }
  items.push({ icon: 'K', label: clothing[language] });
  return items;
};

export interface CleaningStepGuidance {
  icon: string;
  description: string;
}

const GUIDANCE: Record<string, Record<Language, CleaningStepGuidance>> = {
  'vorbereitung und material bereitstellen': {
    de: { icon: 'V', description: 'Arbeitsmittel, Produkte und Warnschild bereitstellen.' },
    fr: { icon: 'V', description: 'Préparer le matériel, les produits et le panneau.' },
    it: { icon: 'V', description: 'Preparare attrezzatura, prodotti e cartello.' },
    en: { icon: 'V', description: 'Prepare equipment, products and warning sign.' },
  },
  'psa anziehen': {
    de: { icon: 'P', description: 'Vorgesehene persönliche Schutzausrüstung anziehen.' },
    fr: { icon: 'P', description: 'Mettre les équipements de protection prévus.' },
    it: { icon: 'P', description: 'Indossare i dispositivi di protezione previsti.' },
    en: { icon: 'P', description: 'Put on the required personal protective equipment.' },
  },
  'spiegel reinigen': {
    de: { icon: 'S', description: 'Spiegel streifenfrei reinigen und trocken nachwischen.' },
    fr: { icon: 'S', description: 'Nettoyer le miroir sans traces et essuyer.' },
    it: { icon: 'S', description: 'Pulire lo specchio senza aloni e asciugare.' },
    en: { icon: 'S', description: 'Clean the mirror streak-free and wipe dry.' },
  },
  'arbeitsplatz sauber verlassen': {
    de: { icon: 'OK', description: 'Material versorgen und Bereich ordentlich verlassen.' },
    fr: { icon: 'OK', description: 'Ranger le matériel et laisser la zone en ordre.' },
    it: { icon: 'OK', description: 'Riporre il materiale e lasciare l’area in ordine.' },
    en: { icon: 'OK', description: 'Store equipment and leave the area orderly.' },
  },
  'wc reinigen': {
    de: { icon: 'WC', description: 'Becken, Rand und Spülbereich gründlich reinigen.' },
    fr: { icon: 'WC', description: 'Nettoyer soigneusement la cuvette et la zone de chasse.' },
    it: { icon: 'WC', description: 'Pulire accuratamente vaso, bordo e scarico.' },
    en: { icon: 'WC', description: 'Clean the bowl, rim and flush area thoroughly.' },
  },
  'waschbecken reinigen': {
    de: { icon: 'W', description: 'Becken, Ablauf und Überlauf reinigen.' },
    fr: { icon: 'W', description: 'Nettoyer le lavabo, l’écoulement et le trop-plein.' },
    it: { icon: 'W', description: 'Pulire lavabo, scarico e troppo pieno.' },
    en: { icon: 'W', description: 'Clean the basin, drain and overflow.' },
  },
  'armaturen reinigen': {
    de: { icon: 'A', description: 'Armaturen reinigen und trocken nachwischen.' },
    fr: { icon: 'A', description: 'Nettoyer les robinetteries et les essuyer.' },
    it: { icon: 'A', description: 'Pulire la rubinetteria e asciugare.' },
    en: { icon: 'A', description: 'Clean the fittings and wipe them dry.' },
  },
  'boden reinigen': {
    de: { icon: 'B', description: 'Boden passend zum Belag reinigen; Rutschgefahr beachten.' },
    fr: { icon: 'B', description: 'Nettoyer selon le revêtement; attention au sol glissant.' },
    it: { icon: 'B', description: 'Pulire secondo il rivestimento; attenzione al pavimento bagnato.' },
    en: { icon: 'B', description: 'Clean according to the floor; beware of slippery surfaces.' },
  },
  'abfall leeren': {
    de: { icon: 'A', description: 'Abfall sicher entfernen und Behälter sauber einsetzen.' },
    fr: { icon: 'A', description: 'Évacuer les déchets et remettre le conteneur propre.' },
    it: { icon: 'A', description: 'Rimuovere i rifiuti e reinserire il contenitore pulito.' },
    en: { icon: 'A', description: 'Remove waste safely and replace the clean container.' },
  },
  'warnschild aufstellen': {
    de: { icon: '!', description: 'Warnschild «Rutschgefahr» gut sichtbar aufstellen.' },
    fr: { icon: '!', description: 'Placer le panneau «sol glissant» bien visible.' },
    it: { icon: '!', description: 'Posizionare il cartello «pavimento scivoloso» ben visibile.' },
    en: { icon: '!', description: 'Place the wet-floor warning sign clearly visible.' },
  },
  'grobe verschmutzungen entfernen': {
    de: { icon: 'G', description: 'Losen Schmutz, Papier und Abfall zuerst entfernen.' },
    fr: { icon: 'G', description: 'Enlever d’abord la saleté, le papier et les déchets.' },
    it: { icon: 'G', description: 'Rimuovere prima sporco grossolano, carta e rifiuti.' },
    en: { icon: 'G', description: 'Remove loose dirt, paper and waste first.' },
  },
  'maschine und akku kontrollieren': {
    de: { icon: 'M', description: 'Bürsten, Sauglippen, Tank und Ladezustand vor dem Start prüfen.' },
    fr: { icon: 'M', description: 'Vérifier brosses, lèvres, réservoir et charge avant le départ.' },
    it: { icon: 'M', description: 'Controllare spazzole, labbra, serbatoio e carica prima di iniziare.' },
    en: { icon: 'M', description: 'Check brushes, squeegee, tank and charge before starting.' },
  },
  'reinigungsmittel nach herstellerangaben dosieren': {
    de: { icon: 'D', description: 'Produkt gemäss Etikett/Herstellerangabe dosieren, nie mischen.' },
    fr: { icon: 'D', description: 'Doser selon l’étiquette/le fabricant, ne jamais mélanger.' },
    it: { icon: 'D', description: 'Dosare secondo etichetta/produttore, non mescolare mai.' },
    en: { icon: 'D', description: 'Dose according to label/manufacturer, never mix.' },
  },
  'fläche in bahnen maschinell reinigen': {
    de: { icon: 'M', description: 'Überlappende Bahnen fahren, Geschwindigkeit dem Schmutz anpassen.' },
    fr: { icon: 'M', description: 'Passer en bandes qui se chevauchent, vitesse selon la saleté.' },
    it: { icon: 'M', description: 'Procedere a strisce sovrapposte, velocità secondo lo sporco.' },
    en: { icon: 'M', description: 'Drive overlapping lanes, adapt speed to soiling.' },
  },
  'reinigungsfläche frei räumen': {
    de: { icon: 'F', description: 'Bewegliche Gegenstände wegräumen, Fläche zugänglich machen.' },
    fr: { icon: 'F', description: 'Dégager les objets mobiles, rendre la surface accessible.' },
    it: { icon: 'F', description: 'Spostare gli oggetti mobili, rendere accessibile la superficie.' },
    en: { icon: 'F', description: 'Move loose items away, make the area accessible.' },
  },
  'staubwischen oder trockensaugen': {
    de: { icon: 'B', description: 'Losen Schmutz mit Staubwischtuch oder Trockensauger aufnehmen.' },
    fr: { icon: 'B', description: 'Ramasser la saleté avec la lingette ou l’aspirateur.' },
    it: { icon: 'B', description: 'Raccogliere lo sporco con panno antipolvere o aspiratore.' },
    en: { icon: 'B', description: 'Pick up loose dirt with dust wipe or dry vacuum.' },
  },
  'unter den möbeln mit dem flachmopp reinigen': {
    de: { icon: 'R', description: 'Bereiche, die die Maschine nicht erreicht, mit dem Flachmopp reinigen.' },
    fr: { icon: 'R', description: 'Nettoyer au balai plat les zones inaccessibles à la machine.' },
    it: { icon: 'R', description: 'Pulire con il mop piatto le zone non raggiungibili dalla macchina.' },
    en: { icon: 'R', description: 'Clean areas the machine cannot reach with the flat mop.' },
  },
  'mit der maschine den rändern entlang scheuern': {
    de: { icon: 'M', description: 'Im Schritttempo den Rändern entlang fahren; der Rand muss nass sein.' },
    fr: { icon: 'M', description: 'Longer les bords au pas; le bord doit être mouillé.' },
    it: { icon: 'M', description: 'Percorrere i bordi a passo d’uomo; il bordo deve essere bagnato.' },
    en: { icon: 'M', description: 'Drive along the edges at walking pace; the edge must be wet.' },
  },
  'fläche in überlappenden bahnen scheuern': {
    de: { icon: 'M', description: 'Fläche in überlappenden Bahnen scheuern; die Fläche muss nass sein.' },
    fr: { icon: 'M', description: 'Récurer en bandes qui se chevauchent; la surface doit être mouillée.' },
    it: { icon: 'M', description: 'Strofinare a strisce sovrapposte; la superficie deve essere bagnata.' },
    en: { icon: 'M', description: 'Scrub in overlapping lanes; the surface must be wet.' },
  },
  'reinigungslösung einwirken lassen': {
    de: { icon: 'T', description: 'Einwirkzeit gemäss Herstellerangabe einhalten; Lösung nicht antrocknen lassen.' },
    fr: { icon: 'T', description: 'Respecter le temps d’action du fabricant; ne pas laisser sécher.' },
    it: { icon: 'T', description: 'Rispettare il tempo di azione del produttore; non far asciugare.' },
    en: { icon: 'T', description: 'Observe the manufacturer contact time; do not let it dry.' },
  },
  'fläche in überlappenden bahnen scheuersaugen': {
    de: { icon: 'M', description: 'Den Rändern entlang und die Fläche in überlappenden Bahnen scheuersaugen.' },
    fr: { icon: 'M', description: 'Récurer-aspirer le long des bords et la surface en bandes.' },
    it: { icon: 'M', description: 'Lavare-asciugare lungo i bordi e la superficie a strisce sovrapposte.' },
    en: { icon: 'M', description: 'Scrub-dry along the edges and the area in overlapping lanes.' },
  },
  'wasser ausschalten und maschine in den reinigungsraum fahren': {
    de: { icon: 'M', description: 'Am Ende der Fläche Wasser ausschalten und in den Reinigungsraum fahren.' },
    fr: { icon: 'M', description: 'En fin de surface, couper l’eau et rejoindre le local de nettoyage.' },
    it: { icon: 'M', description: 'A fine superficie chiudere l’acqua e portare la macchina nel locale pulizie.' },
    en: { icon: 'M', description: 'At the end of the area switch off water and drive to the cleaning room.' },
  },
  'warnschild versorgen': {
    de: { icon: '!', description: 'Warnschild erst nach dem Trocknen der Fläche entfernen und versorgen.' },
    fr: { icon: '!', description: 'Retirer et ranger le panneau seulement une fois le sol sec.' },
    it: { icon: '!', description: 'Togliere e riporre il cartello solo quando il pavimento è asciutto.' },
    en: { icon: '!', description: 'Remove and store the sign only once the floor is dry.' },
  },
  'randbereiche manuell nachreinigen': {
    de: { icon: 'R', description: 'Ecken, Kanten und Bereiche unter Möbeln mit Mopp nacharbeiten.' },
    fr: { icon: 'R', description: 'Reprendre coins, bords et dessous de meubles au balai-mop.' },
    it: { icon: 'R', description: 'Rifinire angoli, bordi e sotto i mobili con il mop.' },
    en: { icon: 'R', description: 'Finish corners, edges and under furniture with a mop.' },
  },
  'schmutzwasser entleeren': {
    de: { icon: 'E', description: 'Schmutzwassertank am vorgesehenen Ausguss entleeren und spülen.' },
    fr: { icon: 'E', description: 'Vider le réservoir d’eau sale au déversoir prévu et rincer.' },
    it: { icon: 'E', description: 'Svuotare il serbatoio acqua sporca nello scarico previsto e sciacquare.' },
    en: { icon: 'E', description: 'Empty the recovery tank at the designated drain and rinse.' },
  },
  'maschine reinigen und laden': {
    de: { icon: 'M', description: 'Bürsten und Sauglippen reinigen, Tank offen trocknen, Akku laden.' },
    fr: { icon: 'M', description: 'Nettoyer brosses et lèvres, laisser sécher le réservoir, charger.' },
    it: { icon: 'M', description: 'Pulire spazzole e labbra, far asciugare il serbatoio, ricaricare.' },
    en: { icon: 'M', description: 'Clean brushes and squeegee, leave tank open to dry, charge.' },
  },
  'boden trocknen lassen': {
    de: { icon: 'B', description: 'Fläche erst freigeben, wenn sie trocken ist; Schild danach entfernen.' },
    fr: { icon: 'B', description: 'Libérer la surface une fois sèche; retirer ensuite le panneau.' },
    it: { icon: 'B', description: 'Liberare la superficie solo quando asciutta; poi togliere il cartello.' },
    en: { icon: 'B', description: 'Release the area only when dry; then remove the sign.' },
  },
  'boden trocken reinigen': {
    de: { icon: 'B', description: 'Staub und losen Schmutz mit Mopp oder Sauger aufnehmen.' },
    fr: { icon: 'B', description: 'Ramasser poussière et saletés avec mop ou aspirateur.' },
    it: { icon: 'B', description: 'Raccogliere polvere e sporco con mop o aspiratore.' },
    en: { icon: 'B', description: 'Pick up dust and loose dirt with mop or vacuum.' },
  },
  'boden feucht wischen': {
    de: { icon: 'B', description: 'Nebelfeucht wischen, Belag beachten, Wasser regelmässig wechseln.' },
    fr: { icon: 'B', description: 'Essuyer légèrement humide, selon le revêtement, changer l’eau.' },
    it: { icon: 'B', description: 'Passare umido, secondo il rivestimento, cambiare l’acqua.' },
    en: { icon: 'B', description: 'Damp-mop according to the floor, change water regularly.' },
  },
  'sichtkontrolle': {
    de: { icon: 'OK', description: 'Raum auf Sauberkeit, Schäden und vergessene Materialien prüfen.' },
    fr: { icon: 'OK', description: 'Contrôler la propreté, les dégâts et le matériel oublié.' },
    it: { icon: 'OK', description: 'Controllare pulizia, danni e materiali dimenticati.' },
    en: { icon: 'OK', description: 'Check cleanliness, damage and forgotten materials.' },
  },
};

export const guidanceFor = (text: string | undefined, language: Language): CleaningStepGuidance => {
  const key = (text ?? '').trim().toLocaleLowerCase('de-CH');
  const exact = GUIDANCE[key]?.[language];
  if (exact) return exact;
  const rules: Array<{ match: string[]; icon: string; descriptions: Record<Language, string> }> = [
    {
      match: ['sitz', 'türgriffe', 'griffbereiche', 'kontaktflächen', 'armaturen', 'spiegel', 'rahmen', 'fensterbank'],
      icon: 'S',
      descriptions: {
        de: 'Fläche vollständig reinigen und trocken nachwischen.',
        fr: 'Nettoyer entièrement la surface et essuyer à sec.',
        it: 'Pulire completamente la superficie e asciugare.',
        en: 'Clean the surface completely and wipe dry.',
      },
    },
    {
      match: ['toilettenpapier', 'seife', 'verbrauchsmaterial', 'neue säcke'],
      icon: 'P',
      descriptions: {
        de: 'Bestand prüfen und Verbrauchsmaterial vollständig auffüllen.',
        fr: 'Vérifier le stock et remplir complètement les consommables.',
        it: 'Controllare la scorta e rifornire completamente i consumabili.',
        en: 'Check stock and replenish consumables completely.',
      },
    },
    {
      match: ['abfall', 'papierkorb', 'behälter', 'sortieren'],
      icon: 'A',
      descriptions: {
        de: 'Abfall gemäss Vorgabe entfernen, sortieren und Behälter sauber hinterlassen.',
        fr: 'Évacuer et trier les déchets selon les consignes; laisser les conteneurs propres.',
        it: 'Rimuovere e separare i rifiuti secondo le disposizioni; lasciare puliti i contenitori.',
        en: 'Remove and sort waste as instructed; leave bins clean.',
      },
    },
    {
      match: ['desinfiz', 'desinfektionsmittel'],
      icon: 'D',
      descriptions: {
        de: 'Geeignetes Mittel gemäss Herstellerangabe anwenden und Einwirkzeit einhalten.',
        fr: 'Utiliser le produit selon le fabricant et respecter le temps d’action.',
        it: 'Usare il prodotto secondo il produttore e rispettare il tempo di azione.',
        en: 'Use the product according to the manufacturer and observe contact time.',
      },
    },
    {
      match: ['lüften'],
      icon: 'L',
      descriptions: {
        de: 'Raum angemessen lüften und danach Fenster und Türen sichern.',
        fr: 'Aérer suffisamment la pièce, puis sécuriser fenêtres et portes.',
        it: 'Arieggiare adeguatamente il locale, quindi mettere in sicurezza finestre e porte.',
        en: 'Ventilate the room adequately, then secure windows and doors.',
      },
    },
    {
      match: ['boden', 'treppen', 'podeste', 'umfeld'],
      icon: 'B',
      descriptions: {
        de: 'Fläche vollständig und passend zum Belag reinigen; Rutschgefahr beachten.',
        fr: 'Nettoyer entièrement la surface selon le revêtement; tenir compte du risque de glissade.',
        it: 'Pulire completamente la superficie in base al rivestimento; considerare il rischio di scivolamento.',
        en: 'Clean the surface according to its covering; consider slip risk.',
      },
    },
    {
      match: ['reinigen', 'kontrollieren', 'verschmutzungen', 'spinnweben', 'wände', 'einrichtung'],
      icon: 'S',
      descriptions: {
        de: 'Bereich vollständig bearbeiten und sichtbare Verschmutzungen entfernen.',
        fr: 'Traiter entièrement la zone et enlever les salissures visibles.',
        it: 'Trattare completamente la zona e rimuovere lo sporco visibile.',
        en: 'Complete the area and remove visible soiling.',
      },
    },
  ];
  const rule = rules.find(({ match }) => match.some((part) => key.includes(part)));
  if (rule) return { icon: rule.icon, description: rule.descriptions[language] };
  const generic: Record<Language, CleaningStepGuidance> = {
    de: { icon: '✓', description: 'Arbeitsschritt gemäss Arbeitsanweisung vollständig ausführen.' },
    fr: { icon: '✓', description: 'Effectuer entièrement l’étape selon l’instruction.' },
    it: { icon: '✓', description: 'Eseguire completamente il passaggio secondo l’istruzione.' },
    en: { icon: '✓', description: 'Complete this step according to the work instruction.' },
  };
  return generic[language];
};

export const safetyNotesFor = (type: string, language: Language): string[] => {
  const notes: Record<string, Record<Language, string[]>> = {
    sanitary: {
      de: ['Handschuhe tragen. Reinigungsmittel nie mischen.', 'Nach Herstellerangaben dosieren und gut lüften.', 'Bei nassem Boden Rutschgefahr kennzeichnen.'],
      fr: ['Porter des gants. Ne jamais mélanger les produits.', 'Doser selon le fabricant et bien aérer.', 'Signaler le risque de glissade sur sol humide.'],
      it: ['Indossare guanti. Non mescolare mai i prodotti.', 'Dosare secondo il produttore e aerare bene.', 'Segnalare il rischio di scivolamento sul pavimento bagnato.'],
      en: ['Wear gloves. Never mix cleaning products.', 'Dose according to the manufacturer and ventilate well.', 'Mark slippery wet floors.'],
    },
    window: {
      de: ['Bei Arbeiten in der Höhe nur geeignete, sichere Ausrüstung verwenden.', 'Glasreiniger nach Herstellerangaben dosieren und Umgebung trocken halten.'],
      fr: ['Pour les travaux en hauteur, utiliser un équipement adapté et sûr.', 'Doser le produit selon le fabricant et garder les abords secs.'],
      it: ['Per lavori in quota usare solo attrezzatura idonea e sicura.', 'Dosare secondo il produttore e tenere asciutta l’area.'],
      en: ['Use suitable, safe equipment for work at height.', 'Dose according to the manufacturer and keep surrounding areas dry.'],
    },
    scrubber: {
      de: ['Nur nach Einweisung bedienen; Betriebsanleitung des Herstellers beachten.', 'Reinigungsmittel nach Herstellerangaben dosieren, nie mischen.', 'Nasse Flächen kennzeichnen; Kabel und Akku vor Nässe schützen.'],
      fr: ['Utiliser uniquement après instruction; respecter le manuel du fabricant.', 'Doser selon le fabricant, ne jamais mélanger.', 'Signaler les surfaces humides; protéger câbles et batterie de l’eau.'],
      it: ['Usare solo dopo istruzione; rispettare il manuale del produttore.', 'Dosare secondo il produttore, non mescolare mai.', 'Segnalare le superfici bagnate; proteggere cavi e batteria dall’acqua.'],
      en: ['Operate only after instruction; follow the manufacturer manual.', 'Dose according to the manufacturer, never mix.', 'Mark wet surfaces; keep cables and battery away from water.'],
    },
    floor: {
      de: ['Warnschild «Rutschgefahr» aufstellen.', 'Reinigungsmittel passend zum Belag und nach Herstellerangaben dosieren.', 'Nie Reinigungsmittel mischen.'],
      fr: ['Placer le panneau «sol glissant».', 'Doser le produit selon le revêtement et le fabricant.', 'Ne jamais mélanger les produits.'],
      it: ['Posizionare il cartello «pavimento scivoloso».', 'Dosare il prodotto secondo il rivestimento e il produttore.', 'Non mescolare mai i prodotti.'],
      en: ['Place the wet-floor sign.', 'Dose the product according to the floor and the manufacturer.', 'Never mix products.'],
    },
    disinfection: {
      de: ['Schutzhandschuhe tragen; Augenschutz bei Spritzgefahr verwenden.', 'Desinfektionsmittel nie mischen, Dosierung und Einwirkzeit beachten.', 'Raum nach Vorgabe lüften und Sicherheitsdatenblatt beachten.'],
      fr: ['Porter des gants; utiliser une protection oculaire en cas de projections.', 'Ne jamais mélanger les désinfectants; respecter le dosage et le temps d’action.', 'Aérer selon les consignes et respecter la fiche de données de sécurité.'],
      it: ['Indossare guanti; usare protezione occhi in caso di schizzi.', 'Non mescolare i disinfettanti; rispettare dosaggio e tempo di contatto.', 'Aerare secondo le istruzioni e rispettare la scheda di sicurezza.'],
      en: ['Wear gloves; use eye protection where splashes are possible.', 'Never mix disinfectants; follow dosage and contact time.', 'Ventilate as instructed and follow the safety data sheet.'],
    },
  };
  return (notes[type] ?? {
    de: ['Herstellerangaben und Sicherheitsdatenblätter beachten.', 'Reinigungsmittel nie mischen und nasse Stellen kennzeichnen.'],
    fr: ['Respecter les instructions du fabricant et les fiches de données de sécurité.', 'Ne jamais mélanger les produits et signaler les zones humides.'],
    it: ['Rispettare le indicazioni del produttore e le schede di sicurezza.', 'Non mescolare i prodotti e segnalare le zone bagnate.'],
    en: ['Follow manufacturer instructions and safety data sheets.', 'Never mix products and mark wet areas.'],
  })[language];
};

type Localized = Record<Language, string>;
type LocalizedList = Record<Language, string[]>;

const L = (de: string, fr: string, it: string, en: string): Localized => ({ de, fr, it, en });

/** Kurzbezeichnung der Methode (Zeile «Reinigungsart» der Arbeitsanleitung). */
const METHODS: Record<string, Localized> = {
  sanitary: L('Unterhaltsreinigung Sanitär', 'Nettoyage d’entretien sanitaires', 'Pulizia di mantenimento sanitari', 'Routine cleaning sanitary'),
  sanitaryDeep: L('Grundreinigung Sanitär', 'Nettoyage à fond sanitaires', 'Pulizia di fondo sanitari', 'Deep cleaning sanitary'),
  office: L('Unterhaltsreinigung Büro', 'Nettoyage d’entretien bureaux', 'Pulizia di mantenimento uffici', 'Routine cleaning office'),
  room: L('Unterhaltsreinigung Zimmer', 'Nettoyage d’entretien chambres', 'Pulizia di mantenimento camere', 'Routine cleaning room'),
  careRoom: L('Unterhaltsreinigung Pflegezimmer', 'Nettoyage d’entretien chambre de soins', 'Pulizia camera di cura', 'Routine cleaning care room'),
  bathroom: L('Unterhaltsreinigung Dusche/Bad', 'Nettoyage d’entretien douche/bain', 'Pulizia doccia/bagno', 'Routine cleaning shower/bath'),
  stairway: L('Unterhaltsreinigung Treppenhaus', 'Nettoyage d’entretien cage d’escalier', 'Pulizia vano scale', 'Routine cleaning stairwell'),
  corridor: L('Unterhaltsreinigung Korridor', 'Nettoyage d’entretien couloir', 'Pulizia corridoio', 'Routine cleaning corridor'),
  kitchen: L('Unterhaltsreinigung Küche', 'Nettoyage d’entretien cuisine', 'Pulizia cucina', 'Routine cleaning kitchen'),
  deep: L('Grundreinigung', 'Nettoyage à fond', 'Pulizia di fondo', 'Deep cleaning'),
  disinfection: L('Desinfektionsreinigung (Wisch-Desinfektion)', 'Nettoyage désinfectant (par essuyage)', 'Pulizia disinfettante (per strofinamento)', 'Disinfection cleaning (wipe disinfection)'),
  waste: L('Abfallentsorgung', 'Évacuation des déchets', 'Smaltimento rifiuti', 'Waste disposal'),
  floor: L('Bodenreinigung manuell (Feuchtwischen)', 'Nettoyage des sols manuel (humide)', 'Pulizia pavimenti manuale (umido)', 'Manual floor cleaning (damp mopping)'),
  scrubber: L('Scheuersaugmaschine – indirekte Methode', 'Autolaveuse – méthode indirecte', 'Lavasciuga – metodo indiretto', 'Scrubber dryer – indirect method'),
  window: L('Fensterreinigung innen/aussen', 'Nettoyage des vitres intérieur/extérieur', 'Pulizia vetri interno/esterno', 'Window cleaning inside/outside'),
};

export const methodFor = (type: string, language: Language): string =>
  (METHODS[type] ?? L('Unterhaltsreinigung', 'Nettoyage d’entretien', 'Pulizia di mantenimento', 'Routine cleaning'))[language];

const BASE_MATERIAL: LocalizedList = {
  de: ['1 Reinigungswagen oder Eimer', '2 Mikrofasertücher (farbcodiert)', '1 Abfallsack', '1 Warnschild «Rutschgefahr»'],
  fr: ['1 chariot ou seau', '2 chiffons microfibres (codés couleur)', '1 sac à déchets', '1 panneau «sol glissant»'],
  it: ['1 carrello o secchio', '2 panni in microfibra (codice colore)', '1 sacco rifiuti', '1 cartello «pavimento scivoloso»'],
  en: ['1 cleaning trolley or bucket', '2 microfibre cloths (colour-coded)', '1 waste bag', '1 wet-floor sign'],
};

/** Reinigungsmaterial und Geräte mit Mengen je Reinigungsart. */
const MATERIAL: Record<string, LocalizedList> = {
  sanitary: {
    de: ['3 Mikrofasertücher (rot WC, gelb Sanitär, blau Flächen)', '1 WC-Bürste', '1 Flachmopp mit Bezug', '1 Abfallsack', 'Toilettenpapier, Seife, Papierhandtücher', '1 Warnschild «Rutschgefahr»'],
    fr: ['3 chiffons microfibres (rouge WC, jaune sanitaire, bleu surfaces)', '1 brosse WC', '1 balai plat avec housse', '1 sac à déchets', 'Papier WC, savon, essuie-mains', '1 panneau «sol glissant»'],
    it: ['3 panni microfibra (rosso WC, giallo sanitari, blu superfici)', '1 scopino WC', '1 mop piatto con ricambio', '1 sacco rifiuti', 'Carta igienica, sapone, asciugamani di carta', '1 cartello «pavimento scivoloso»'],
    en: ['3 microfibre cloths (red toilet, yellow sanitary, blue surfaces)', '1 toilet brush', '1 flat mop with pad', '1 waste bag', 'Toilet paper, soap, paper towels', '1 wet-floor sign'],
  },
  sanitaryDeep: {
    de: ['3 Mikrofasertücher (farbcodiert)', '1 WC-Bürste', '1 Handpad / Fugenbürste', '1 Flachmopp mit Bezug', '2 Abfallsäcke', '1 Warnschild «Rutschgefahr»'],
    fr: ['3 chiffons microfibres (codés couleur)', '1 brosse WC', '1 tampon à main / brosse à joints', '1 balai plat avec housse', '2 sacs à déchets', '1 panneau «sol glissant»'],
    it: ['3 panni microfibra (codice colore)', '1 scopino WC', '1 pad manuale / spazzola fughe', '1 mop piatto con ricambio', '2 sacchi rifiuti', '1 cartello «pavimento scivoloso»'],
    en: ['3 microfibre cloths (colour-coded)', '1 toilet brush', '1 hand pad / grout brush', '1 flat mop with pad', '2 waste bags', '1 wet-floor sign'],
  },
  office: {
    de: ['2 Mikrofasertücher (blau Flächen)', '1 Flachmopp mit Bezug oder Staubsauger', '1 Einwegstaubwischtuch', '1 Abfallsack', '1 Warnschild «Rutschgefahr»'],
    fr: ['2 chiffons microfibres (bleu surfaces)', '1 balai plat avec housse ou aspirateur', '1 lingette à poussière jetable', '1 sac à déchets', '1 panneau «sol glissant»'],
    it: ['2 panni microfibra (blu superfici)', '1 mop piatto con ricambio o aspiratore', '1 panno antipolvere monouso', '1 sacco rifiuti', '1 cartello «pavimento scivoloso»'],
    en: ['2 microfibre cloths (blue surfaces)', '1 flat mop with pad or vacuum cleaner', '1 disposable dust wipe', '1 waste bag', '1 wet-floor sign'],
  },
  kitchen: {
    de: ['2 Mikrofasertücher (grün Küche)', '1 Handpad (kratzfrei)', '1 Flachmopp mit Bezug', '1 Abfallsack', '1 Warnschild «Rutschgefahr»'],
    fr: ['2 chiffons microfibres (vert cuisine)', '1 tampon à main (non abrasif)', '1 balai plat avec housse', '1 sac à déchets', '1 panneau «sol glissant»'],
    it: ['2 panni microfibra (verde cucina)', '1 pad manuale (non graffiante)', '1 mop piatto con ricambio', '1 sacco rifiuti', '1 cartello «pavimento scivoloso»'],
    en: ['2 microfibre cloths (green kitchen)', '1 hand pad (non-scratch)', '1 flat mop with pad', '1 waste bag', '1 wet-floor sign'],
  },
  floor: {
    de: ['1 Flachmopp mit 2 Bezügen', '1 Einwegstaubwischtuch oder Trockensauger', '1 Eimer mit Presse', '1 Warnschild «Rutschgefahr»'],
    fr: ['1 balai plat avec 2 housses', '1 lingette à poussière jetable ou aspirateur', '1 seau avec presse', '1 panneau «sol glissant»'],
    it: ['1 mop piatto con 2 ricambi', '1 panno antipolvere monouso o aspiratore', '1 secchio con strizzatore', '1 cartello «pavimento scivoloso»'],
    en: ['1 flat mop with 2 pads', '1 disposable dust wipe or dry vacuum', '1 bucket with wringer', '1 wet-floor sign'],
  },
  scrubber: {
    de: ['Scheuersaugmaschine (Akku geladen)', '2 Mikrofasertücher', '1 Flachmopp oder mehr je nach Bodenfläche', '1 Einwegstaubwischtuch oder Trockensauger', '1 Randreinigungs-Pad / Randreinigungsgerät', '1 Wäschesack für schmutzige Textilien', '1 Nasswischgerät gross', '1 Warnschild «Rutschgefahr»'],
    fr: ['Autolaveuse (batterie chargée)', '2 chiffons microfibres', '1 balai plat ou plus selon la surface', '1 lingette à poussière jetable ou aspirateur', '1 pad / outil de nettoyage des bords', '1 sac à linge pour textiles sales', '1 grand balai humide', '1 panneau «sol glissant»'],
    it: ['Lavasciuga (batteria carica)', '2 panni microfibra', '1 mop piatto o più secondo la superficie', '1 panno antipolvere monouso o aspiratore', '1 pad / attrezzo per bordi', '1 sacco per tessili sporchi', '1 attrezzo lavaggio grande', '1 cartello «pavimento scivoloso»'],
    en: ['Scrubber dryer (battery charged)', '2 microfibre cloths', '1 flat mop or more depending on floor area', '1 disposable dust wipe or dry vacuum', '1 edge cleaning pad / edge tool', '1 laundry bag for soiled textiles', '1 large wet mop tool', '1 wet-floor sign'],
  },
  window: {
    de: ['1 Einwascher mit Bezug', '1 Fensterabzieher', '2 Mikrofasertücher (Rahmen/Abtrocknen)', '1 Eimer', '1 sichere Steighilfe', '1 Abdecktuch für Fensterbank/Boden'],
    fr: ['1 mouilleur avec housse', '1 raclette à vitres', '2 chiffons microfibres (cadres/séchage)', '1 seau', '1 escabeau sécurisé', '1 bâche pour rebord/sol'],
    it: ['1 vello lavavetri', '1 tergivetro', '2 panni microfibra (telai/asciugatura)', '1 secchio', '1 scala sicura', '1 telo per davanzale/pavimento'],
    en: ['1 window washer with sleeve', '1 window squeegee', '2 microfibre cloths (frames/drying)', '1 bucket', '1 safe step ladder', '1 drop cloth for sill/floor'],
  },
  disinfection: {
    de: ['Einweg- oder farbcodierte Mikrofasertücher', '1 Dosierhilfe', '1 Flachmopp mit Bezug', '1 Abfallsack', '1 Warnschild «Rutschgefahr»'],
    fr: ['Chiffons jetables ou microfibres codés couleur', '1 doseur', '1 balai plat avec housse', '1 sac à déchets', '1 panneau «sol glissant»'],
    it: ['Panni monouso o microfibra codice colore', '1 dosatore', '1 mop piatto con ricambio', '1 sacco rifiuti', '1 cartello «pavimento scivoloso»'],
    en: ['Disposable or colour-coded microfibre cloths', '1 dosing aid', '1 flat mop with pad', '1 waste bag', '1 wet-floor sign'],
  },
  waste: {
    de: ['Abfallsäcke passend zu den Behältern', '1 Mikrofasertuch für Behälter', '1 Transportwagen', 'Rollcontainer / Sammelstelle'],
    fr: ['Sacs adaptés aux conteneurs', '1 chiffon microfibre pour conteneurs', '1 chariot de transport', 'Conteneur roulant / point de collecte'],
    it: ['Sacchi adatti ai contenitori', '1 panno microfibra per contenitori', '1 carrello di trasporto', 'Container / punto di raccolta'],
    en: ['Waste bags matching the bins', '1 microfibre cloth for bins', '1 transport trolley', 'Wheeled container / collection point'],
  },
  stairway: {
    de: ['2 Mikrofasertücher (Handläufe)', '1 Besen oder Staubsauger', '1 Flachmopp mit Bezug', '1 Abfallsack', '1 Warnschild «Rutschgefahr»'],
    fr: ['2 chiffons microfibres (mains courantes)', '1 balai ou aspirateur', '1 balai plat avec housse', '1 sac à déchets', '1 panneau «sol glissant»'],
    it: ['2 panni microfibra (corrimano)', '1 scopa o aspiratore', '1 mop piatto con ricambio', '1 sacco rifiuti', '1 cartello «pavimento scivoloso»'],
    en: ['2 microfibre cloths (handrails)', '1 broom or vacuum cleaner', '1 flat mop with pad', '1 waste bag', '1 wet-floor sign'],
  },
};

export const materialFor = (type: string, language: Language): string[] =>
  (MATERIAL[type] ?? BASE_MATERIAL)[language];

/** Reinigungsmittel je Reinigungsart; Anwendung/Dosierung stets gemäss Herstellerangaben. */
const AGENTS: Record<string, LocalizedList> = {
  sanitary: { de: ['Sanitärreiniger', 'WC-Reiniger'], fr: ['Nettoyant sanitaire', 'Nettoyant WC'], it: ['Detergente sanitari', 'Detergente WC'], en: ['Sanitary cleaner', 'Toilet cleaner'] },
  sanitaryDeep: { de: ['Sanitär-Grundreiniger', 'WC-Reiniger', 'Desinfektionsmittel, falls vorgesehen'], fr: ['Nettoyant sanitaire à fond', 'Nettoyant WC', 'Désinfectant si prévu'], it: ['Detergente di fondo sanitari', 'Detergente WC', 'Disinfettante se previsto'], en: ['Sanitary deep cleaner', 'Toilet cleaner', 'Disinfectant if specified'] },
  bathroom: { de: ['Sanitärreiniger', 'Kalklöser bei Bedarf'], fr: ['Nettoyant sanitaire', 'Détartrant si besoin'], it: ['Detergente sanitari', 'Anticalcare se necessario'], en: ['Sanitary cleaner', 'Descaler if needed'] },
  kitchen: { de: ['Fettlöser / Küchenreiniger', 'Neutralreiniger'], fr: ['Dégraissant / nettoyant cuisine', 'Nettoyant neutre'], it: ['Sgrassatore / detergente cucina', 'Detergente neutro'], en: ['Degreaser / kitchen cleaner', 'Neutral cleaner'] },
  disinfection: { de: ['Flächendesinfektionsmittel', 'Neutralreiniger für Vorreinigung'], fr: ['Désinfectant de surfaces', 'Nettoyant neutre pour prénettoyage'], it: ['Disinfettante per superfici', 'Detergente neutro per prepulizia'], en: ['Surface disinfectant', 'Neutral cleaner for pre-cleaning'] },
  window: { de: ['Glasreiniger'], fr: ['Nettoyant vitres'], it: ['Detergente vetri'], en: ['Glass cleaner'] },
  floor: { de: ['Bodenreiniger passend zum Belag', 'Neutralreiniger'], fr: ['Nettoyant sols adapté au revêtement', 'Nettoyant neutre'], it: ['Detergente pavimenti adatto al rivestimento', 'Detergente neutro'], en: ['Floor cleaner suitable for the covering', 'Neutral cleaner'] },
  scrubber: { de: ['Bodenreiniger (maschinengeeignet, schaumarm)', 'Neutralreiniger'], fr: ['Nettoyant sols (machine, peu moussant)', 'Nettoyant neutre'], it: ['Detergente pavimenti (per macchina, poca schiuma)', 'Detergente neutro'], en: ['Floor cleaner (machine-suitable, low-foam)', 'Neutral cleaner'] },
  waste: { de: ['Neutralreiniger für Behälter'], fr: ['Nettoyant neutre pour conteneurs'], it: ['Detergente neutro per contenitori'], en: ['Neutral cleaner for bins'] },
};

export const agentsFor = (type: string, language: Language): string[] =>
  (AGENTS[type] ?? { de: ['Neutralreiniger'], fr: ['Nettoyant neutre'], it: ['Detergente neutro'], en: ['Neutral cleaner'] })[language];

export const dosageNote = (language: Language): string =>
  L(
    'Anwendung und Dosierung gemäss Herstellerangaben (Etikett / Sicherheitsdatenblatt). Reinigungsmittel nie mischen.',
    'Application et dosage selon les indications du fabricant (étiquette / fiche de données de sécurité). Ne jamais mélanger les produits.',
    'Applicazione e dosaggio secondo le indicazioni del produttore (etichetta / scheda di sicurezza). Non mescolare mai i prodotti.',
    'Use and dosage according to manufacturer instructions (label / safety data sheet). Never mix cleaning products.',
  )[language];

/** Arbeitsmittel eines Schritts (linke Spalte der Arbeitsanleitung), nur wo eindeutig. */
const TOOLS: Record<string, Localized> = {
  'wc reinigen': L('WC-Bürste / rotes Tuch', 'Brosse WC / chiffon rouge', 'Scopino / panno rosso', 'Toilet brush / red cloth'),
  'wc-sitz reinigen': L('Rotes Tuch', 'Chiffon rouge', 'Panno rosso', 'Red cloth'),
  'wc-schüssel und sitz gründlich reinigen': L('WC-Bürste / rotes Tuch', 'Brosse WC / chiffon rouge', 'Scopino / panno rosso', 'Toilet brush / red cloth'),
  'waschbecken reinigen': L('Gelbes Tuch', 'Chiffon jaune', 'Panno giallo', 'Yellow cloth'),
  'armaturen reinigen': L('Gelbes Tuch', 'Chiffon jaune', 'Panno giallo', 'Yellow cloth'),
  'armaturen und spiegel reinigen': L('Gelbes Tuch', 'Chiffon jaune', 'Panno giallo', 'Yellow cloth'),
  'spiegel reinigen': L('Mikrofasertuch', 'Chiffon microfibre', 'Panno microfibra', 'Microfibre cloth'),
  'türgriffe reinigen': L('Blaues Tuch', 'Chiffon bleu', 'Panno blu', 'Blue cloth'),
  'oberflächen reinigen': L('Blaues Tuch', 'Chiffon bleu', 'Panno blu', 'Blue cloth'),
  'tische reinigen': L('Blaues Tuch', 'Chiffon bleu', 'Panno blu', 'Blue cloth'),
  'griffbereiche reinigen': L('Blaues Tuch', 'Chiffon bleu', 'Panno blu', 'Blue cloth'),
  'oberflächen und kontaktbereiche reinigen': L('Blaues Tuch', 'Chiffon bleu', 'Panno blu', 'Blue cloth'),
  'kontaktflächen reinigen': L('Mikrofasertuch', 'Chiffon microfibre', 'Panno microfibra', 'Microfibre cloth'),
  'kontaktflächen reinigen und desinfizieren': L('Einwegtuch', 'Chiffon jetable', 'Panno monouso', 'Disposable cloth'),
  'arbeitsflächen reinigen': L('Grünes Tuch', 'Chiffon vert', 'Panno verde', 'Green cloth'),
  'spüle und armaturen reinigen': L('Grünes Tuch', 'Chiffon vert', 'Panno verde', 'Green cloth'),
  'handläufe reinigen': L('Mikrofasertuch', 'Chiffon microfibre', 'Panno microfibra', 'Microfibre cloth'),
  'boden reinigen': L('Flachmopp', 'Balai plat', 'Mop piatto', 'Flat mop'),
  'boden gründlich reinigen': L('Flachmopp / Pad', 'Balai plat / pad', 'Mop piatto / pad', 'Flat mop / pad'),
  'boden trocken reinigen': L('Staubwischtuch / Sauger', 'Lingette / aspirateur', 'Panno antipolvere / aspiratore', 'Dust wipe / vacuum'),
  'boden feucht wischen': L('Flachmopp', 'Balai plat', 'Mop piatto', 'Flat mop'),
  'boden und umfeld reinigen': L('Flachmopp', 'Balai plat', 'Mop piatto', 'Flat mop'),
  'treppen reinigen': L('Besen / Flachmopp', 'Balai / balai plat', 'Scopa / mop piatto', 'Broom / flat mop'),
  'podeste reinigen': L('Flachmopp', 'Balai plat', 'Mop piatto', 'Flat mop'),
  'abfall leeren': L('Abfallsack', 'Sac à déchets', 'Sacco rifiuti', 'Waste bag'),
  'abfall entfernen': L('Abfallsack', 'Sac à déchets', 'Sacco rifiuti', 'Waste bag'),
  'fläche in bahnen maschinell reinigen': L('Scheuersaugen', 'Autolaveuse', 'Lavasciuga', 'Scrubber dryer'),
  'staubwischen oder trockensaugen': L('Staubwischtuch / Sauger', 'Lingette / aspirateur', 'Panno antipolvere / aspiratore', 'Dust wipe / vacuum'),
  'unter den möbeln mit dem flachmopp reinigen': L('Flachmopp', 'Balai plat', 'Mop piatto', 'Flat mop'),
  'mit der maschine den rändern entlang scheuern': L('Scheuern', 'Récurer', 'Strofinare', 'Scrubbing'),
  'fläche in überlappenden bahnen scheuern': L('Scheuern', 'Récurer', 'Strofinare', 'Scrubbing'),
  'reinigungslösung einwirken lassen': L('Einwirkzeit', 'Temps d’action', 'Tempo di azione', 'Contact time'),
  'fläche in überlappenden bahnen scheuersaugen': L('Scheuersaugen', 'Récurer-aspirer', 'Lavare-asciugare', 'Scrub-drying'),
  'wasser ausschalten und maschine in den reinigungsraum fahren': L('Am Ende der Fläche', 'Fin de surface', 'Fine superficie', 'End of area'),
  'warnschild versorgen': L('Warnschild', 'Panneau', 'Cartello', 'Sign'),
  'randbereiche manuell nachreinigen': L('Randreinigungsgerät / Mopp', 'Outil de bords / mop', 'Attrezzo bordi / mop', 'Edge tool / mop'),
  'schmutzwasser entleeren': L('Ausguss', 'Déversoir', 'Scarico', 'Drain'),
  'maschine reinigen und laden': L('Mikrofasertuch', 'Chiffon microfibre', 'Panno microfibra', 'Microfibre cloth'),
  'rahmen reinigen': L('Mikrofasertuch', 'Chiffon microfibre', 'Panno microfibra', 'Microfibre cloth'),
  'fensterbank reinigen': L('Mikrofasertuch', 'Chiffon microfibre', 'Panno microfibra', 'Microfibre cloth'),
  'glas innen reinigen': L('Einwascher / Abzieher', 'Mouilleur / raclette', 'Vello / tergivetro', 'Washer / squeegee'),
  'glas aussen reinigen': L('Einwascher / Abzieher', 'Mouilleur / raclette', 'Vello / tergivetro', 'Washer / squeegee'),
  'desinfektionsmittel nach herstellerangaben dosieren': L('Dosierhilfe', 'Doseur', 'Dosatore', 'Dosing aid'),
  'reinigungsmittel nach herstellerangaben dosieren': L('Dosierhilfe', 'Doseur', 'Dosatore', 'Dosing aid'),
  'toilettenpapier auffüllen': L('Verbrauchsmaterial', 'Consommables', 'Materiale di consumo', 'Consumables'),
  'seife auffüllen': L('Verbrauchsmaterial', 'Consommables', 'Materiale di consumo', 'Consumables'),
  'verbrauchsmaterial auffüllen': L('Verbrauchsmaterial', 'Consommables', 'Materiale di consumo', 'Consumables'),
};

export const toolFor = (text: string | undefined, language: Language): string =>
  TOOLS[(text ?? '').trim().toLocaleLowerCase('de-CH')]?.[language] ?? '';

export const equipmentFor = (type: string, language: Language): string[] => {
  const base: Record<Language, string[]> = {
    de: ['Schutzhandschuhe', 'Mikrofasertücher', 'Eimer und Warnschild'],
    fr: ['Gants de protection', 'Chiffons microfibres', 'Seau et panneau de sol humide'],
    it: ['Guanti protettivi', 'Panni in microfibra', 'Secchio e cartello pavimento bagnato'],
    en: ['Protective gloves', 'Microfibre cloths', 'Bucket and wet-floor sign'],
  };
  if (type === 'window') {
    const heightEquipment: Record<Language, string> = {
      de: 'Sichere Steighilfe',
      fr: 'Escabeau sécurisé',
      it: 'Scala sicura',
      en: 'Safe step ladder',
    };
    return [...base[language], heightEquipment[language]];
  }
  if (type === 'scrubber') {
    const machine: Record<Language, string[]> = {
      de: ['Scheuersaugmaschine', 'Bürsten/Pads', 'Mopp für Randbereiche'],
      fr: ['Autolaveuse', 'Brosses/pads', 'Mop pour les bords'],
      it: ['Lavasciuga', 'Spazzole/pad', 'Mop per i bordi'],
      en: ['Scrubber dryer', 'Brushes/pads', 'Mop for edges'],
    };
    return [...base[language], ...machine[language]];
  }
  if (type === 'floor') {
    const floor: Record<Language, string[]> = {
      de: ['Mopp und Wechselbezüge', 'Staubsauger oder Besen'],
      fr: ['Mop et housses', 'Aspirateur ou balai'],
      it: ['Mop e ricambi', 'Aspiratore o scopa'],
      en: ['Mop and covers', 'Vacuum or broom'],
    };
    return [...base[language], ...floor[language]];
  }
  if (type === 'disinfection') {
    const eyeProtection: Record<Language, string> = {
      de: 'Augenschutz bei Spritzgefahr',
      fr: 'Protection oculaire en cas de projections',
      it: 'Protezione occhi in caso di schizzi',
      en: 'Eye protection where splashes are possible',
    };
    const dosingAid: Record<Language, string> = {
      de: 'Dosierhilfe',
      fr: 'Doseur',
      it: 'Dosatore',
      en: 'Dosing aid',
    };
    return [...base[language], eyeProtection[language], dosingAid[language]];
  }
  return base[language];
};
