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

export const checklistFor = (items: ChecklistItem[], type: string): ChecklistItem[] =>
  items.length > 0 ? items : checklistTemplateFor(type);

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
  'sichtkontrolle': {
    de: { icon: 'OK', description: 'Raum auf Sauberkeit, Schäden und vergessene Materialien prüfen.' },
    fr: { icon: 'OK', description: 'Contrôler la propreté, les dégâts et le matériel oublié.' },
    it: { icon: 'OK', description: 'Controllare pulizia, danni e materiali dimenticati.' },
    en: { icon: 'OK', description: 'Check cleanliness, damage and forgotten materials.' },
  },
};

export const guidanceFor = (text: string, language: Language): CleaningStepGuidance => {
  const key = text.trim().toLocaleLowerCase('de-CH');
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
