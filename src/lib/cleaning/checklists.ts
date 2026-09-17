import { ChecklistItem } from '@/lib/types';
import { newId } from '@/lib/utils/id';

const CHECKLISTS: Record<string, string[]> = {
  sanitary: [
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
    'Sichtkontrolle',
  ],
  office: [
    'Abfall leeren',
    'Papierkorb kontrollieren',
    'Oberflächen reinigen',
    'Tische reinigen',
    'Griffbereiche reinigen',
    'Boden reinigen',
    'Sichtbare Verschmutzungen entfernen',
    'Sichtkontrolle',
  ],
  stairway: [
    'Handläufe reinigen',
    'Treppen reinigen',
    'Podeste reinigen',
    'Abfall entfernen',
    'Spinnweben entfernen',
    'Sichtkontrolle',
  ],
  corridor: ['Boden reinigen', 'Wände und Griffbereiche kontrollieren', 'Abfall entfernen', 'Sichtkontrolle'],
  kitchen: ['Arbeitsflächen reinigen', 'Spüle und Armaturen reinigen', 'Abfall leeren', 'Boden reinigen', 'Sichtkontrolle'],
  window: [
    'Rahmen reinigen',
    'Fensterbank reinigen',
    'Glas innen reinigen',
    'Glas aussen reinigen',
    'Griff reinigen',
    'Umgebung sauber hinterlassen',
    'Sichtkontrolle',
  ],
};

export const checklistTemplateFor = (type: string): ChecklistItem[] =>
  (CHECKLISTS[type] ?? ['Oberflächen reinigen', 'Boden reinigen', 'Abfall entfernen', 'Sichtkontrolle']).map(
    (text) => ({ id: newId('chk'), text, done: false }),
  );

export const checklistFor = (items: ChecklistItem[], type: string): ChecklistItem[] =>
  items.length > 0 ? items : checklistTemplateFor(type);
