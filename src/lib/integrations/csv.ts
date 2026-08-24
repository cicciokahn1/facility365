/**
 * Austausch mit Excel.
 *
 * Excel erwartet in der Schweiz das Semikolon als Trennzeichen und eine
 * Bytefolgemarke, sonst gehen Umlaute verloren. Gelesen wird beides, damit
 * auch Dateien mit Komma weiterverwendet werden koennen.
 */
const SEPARATORS = [';', ','] as const;

const escape = (value: string): string =>
  /[";\n\r,]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export const toCsv = (rows: string[][]): string =>
  rows.map((row) => row.map(escape).join(';')).join('\r\n');

/** Das haeufigste Trennzeichen der Kopfzeile entscheidet. */
const separatorOf = (text: string): string => {
  const header = text.split(/\r?\n/, 1)[0] ?? '';
  let best = ';';
  let count = -1;
  SEPARATORS.forEach((candidate) => {
    const found = header.split(candidate).length - 1;
    if (found > count) {
      best = candidate;
      count = found;
    }
  });
  return best;
};

export const parseCsv = (text: string): string[][] => {
  const clean = text.replace(/^\uFEFF/, '');
  const separator = separatorOf(clean);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    if (quoted) {
      if (char === '"' && clean[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);

  return rows.filter((entry) => entry.some((value) => value.trim() !== ''));
};

/** Text als Datei speichern; die Bytefolgemarke haelt Excel bei Umlauten sauber. */
export const downloadText = (content: string, fileName: string, mimeType: string): void => {
  const blob = new Blob([`\uFEFF${content}`], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
