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
    'Grobe Verschmutzungen entfernen',
    'Reinigungsmittel nach Herstellerangaben dosieren',
    'Fläche in Bahnen maschinell reinigen',
    'Randbereiche manuell nachreinigen',
    'Schmutzwasser entleeren',
    'Maschine reinigen und laden',
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
