/**
 * Zugang zu Supabase.
 *
 * Die Anwendung laeuft in zwei Betriebsarten: mit hinterlegtem Projekt gegen
 * Supabase (Anmeldung, Datenbank, Datentrennung je Benutzer) und ohne Projekt
 * rein lokal im Browser. `isSupabaseConfigured` entscheidet, welche Betriebsart
 * aktiv ist; die Module merken davon nichts.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Nur eine echte Projektadresse zaehlt. Ein Link aus dem Supabase-Dashboard
 * sieht aehnlich aus, fuehrt aber ins Leere; in dem Fall bleibt die Anwendung
 * lokal, statt an einer unerreichbaren Anmeldung zu haengen.
 */
const isProjectUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    /** Entwicklungs- und Testumgebung: dieselbe Datenbank, nur lokal. */
    const local =
      parsed.protocol === 'http:' &&
      (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost');
    return local || (parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co'));
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = (): boolean => isProjectUrl(url) && anonKey.length > 0;

/**
 * Erreichbarkeit des Projekts.
 *
 * Zeigt die Konfiguration auf ein Projekt, das es nicht (mehr) gibt, waere die
 * Anwendung sonst hinter einer Anmeldung eingesperrt, die niemand bedienen
 * kann. In dem Fall arbeitet Facility365 weiter lokal auf dem Geraet.
 */
export const isSupabaseReachable = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(8000),
    });
    return response.ok;
  } catch {
    return false;
  }
};

let client: Promise<SupabaseClient> | null = null;

/**
 * Einzelne Verbindung je Browsersitzung; ohne Konfiguration `null`.
 *
 * Die Bibliothek wird erst geladen, wenn ein Projekt hinterlegt ist - im
 * lokalen Betrieb muss der Start sie gar nicht erst herunterladen.
 */
export const supabase = async (): Promise<SupabaseClient | null> => {
  if (!isSupabaseConfigured()) return null;
  client ??= import('@supabase/ssr').then(({ createBrowserClient }) =>
    createBrowserClient(url, anonKey),
  );
  return client;
};
