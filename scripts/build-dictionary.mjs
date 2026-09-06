/**
 * Erzeugt je Sprache eine eigene Uebersetzungsdatei.
 *
 * Quelle bleibt `src/lib/i18n/dictionary.ts` mit allen Sprachen an einer
 * Stelle. Die Anwendung laedt daraus nur die aktive Sprache, statt beim Start
 * alle vier mitzubringen.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'src/lib/i18n/dictionary.ts'), 'utf8');

const start = source.indexOf('export const dictionary = {');
const end = source.lastIndexOf('} as const satisfies');
if (start < 0 || end < 0) throw new Error('dictionary.ts: Aufbau nicht erkannt');

const literal = source.slice(source.indexOf('{', start), end + 1);
/** Das Woerterbuch enthaelt nur Zeichenketten; darum ist die Auswertung sicher. */
const entries = new Function(`return (${literal});`)();

const languages = ['de', 'fr', 'it', 'en'];
const target = join(root, 'src/lib/i18n/generated');
mkdirSync(target, { recursive: true });

for (const language of languages) {
  const lines = Object.entries(entries).map(([key, entry]) => {
    const text = entry[language];
    if (typeof text !== 'string') throw new Error(`Uebersetzung fehlt: ${key}/${language}`);
    return `  ${JSON.stringify(key)}: ${JSON.stringify(text)},`;
  });
  const file = [
    '/* Erzeugt aus src/lib/i18n/dictionary.ts - nicht von Hand aendern. */',
    '',
    'export const table: Record<string, string> = {',
    ...lines,
    '};',
    '',
  ].join('\n');
  writeFileSync(join(target, `${language}.ts`), file);
}

console.log(`Woerterbuch: ${Object.keys(entries).length} Schluessel je Sprache`);
