/**
 * Ziel eines gescannten Codes bestimmen.
 *
 * Etiketten tragen entweder die vollstaendige Adresse eines Datensatzes
 * (QR-Code aus der App) oder nur eine Kennung (Anlagen-ID, Seriennummer,
 * technische Kennung aus aelteren Etiketten). Beides fuehrt zum Datensatz.
 */
import { findAsset } from '@/lib/assets/passport';
import { MODULES } from '@/lib/modules';
import { Asset } from '@/lib/types';

/** Modulpfade ohne fuehrenden Schraegstrich, laengste zuerst (z. B. cleaning/tasks). */
const MODULE_PATHS = MODULES.map((module) => module.path.replace(/^\//, '')).sort(
  (a, b) => b.length - a.length,
);

/** Pfadanteil eines Codes; funktioniert mit und ohne Adresse davor. */
const pathOf = (text: string): string => {
  const value = text.trim();
  if (value.startsWith('/')) return value;
  try {
    return new URL(value).pathname;
  } catch {
    return '';
  }
};

/**
 * Liefert die Adresse innerhalb der App oder eine leere Zeichenkette, wenn der
 * Code zu keinem bekannten Datensatz gehoert.
 */
export function resolveScan(text: string, assets: Asset[]): string {
  const path = pathOf(text).replace(/\/+$/, '');
  if (path) {
    const rest = path.replace(/^\//, '');
    const known = MODULE_PATHS.some(
      (candidate) => rest === candidate || rest.startsWith(`${candidate}/`),
    );
    if (known) return `/${rest}`;
  }
  const asset = findAsset(assets, text.trim());
  return asset ? `/assets/${asset.number}` : '';
}
