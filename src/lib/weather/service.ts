'use client';

/**
 * Wetterabfrage ueber Open-Meteo (ohne Schluessel, ohne Konto).
 *
 * Der zuletzt gewaehlte Ort wird lokal gemerkt, damit das Dashboard beim
 * naechsten Aufruf sofort etwas anzeigen kann. Es werden keine Daten an
 * Facility365 gespeichert.
 */
import { TranslationKey } from '@/lib/i18n/dictionary';

export interface WeatherPlace {
  name: string;
  latitude: number;
  longitude: number;
}

export interface WeatherNow {
  temperature: number;
  code: number;
  wind: number;
}

const PLACE_KEY = 'facility365.weather.place';

export const readPlace = (): WeatherPlace | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(PLACE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as WeatherPlace).name === 'string' &&
      typeof (parsed as WeatherPlace).latitude === 'number' &&
      typeof (parsed as WeatherPlace).longitude === 'number'
    ) {
      return parsed as WeatherPlace;
    }
  } catch {
    return null;
  }
  return null;
};

export const writePlace = (place: WeatherPlace): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PLACE_KEY, JSON.stringify(place));
};

/** Standort des Geraets, falls der Benutzer die Berechtigung erteilt. */
export const devicePlace = (): Promise<{ latitude: number; longitude: number } | null> =>
  new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 900000 },
    );
  });

interface GeoHit {
  name?: string;
  admin1?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
}

const placeLabel = (hit: GeoHit): string =>
  [hit.name, hit.admin1 && hit.admin1 !== hit.name ? hit.admin1 : '']
    .filter(Boolean)
    .join(', ');

/** Ortssuche fuer die manuelle Auswahl. */
export const searchPlaces = async (term: string, language: string): Promise<WeatherPlace[]> => {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    term,
  )}&count=6&language=${encodeURIComponent(language)}&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('search failed');
  const data: unknown = await response.json();
  const results = (data as { results?: GeoHit[] }).results ?? [];
  return results
    .filter((hit) => typeof hit.latitude === 'number' && typeof hit.longitude === 'number')
    .map((hit) => ({
      name: placeLabel(hit) || String(hit.name ?? ''),
      latitude: Number(hit.latitude),
      longitude: Number(hit.longitude),
    }));
};

/** Ortsname zu Koordinaten, damit der Geraetestandort benannt werden kann. */
export const placeName = async (
  latitude: number,
  longitude: number,
  language: string,
): Promise<string> => {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1&language=${encodeURIComponent(
      language,
    )}&format=json`;
    const response = await fetch(url);
    if (!response.ok) return '';
    const data: unknown = await response.json();
    const hit = ((data as { results?: GeoHit[] }).results ?? [])[0];
    return hit ? placeLabel(hit) : '';
  } catch {
    return '';
  }
};

export const currentWeather = async (
  latitude: number,
  longitude: number,
): Promise<WeatherNow> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('weather failed');
  const data: unknown = await response.json();
  const current = (data as {
    current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number };
  }).current;
  if (!current || typeof current.temperature_2m !== 'number') throw new Error('weather failed');
  return {
    temperature: current.temperature_2m,
    code: Number(current.weather_code ?? 0),
    wind: Number(current.wind_speed_10m ?? 0),
  };
};

/** WMO-Code auf eine kurze, uebersetzte Beschreibung abbilden. */
export const weatherTextKey = (code: number): TranslationKey => {
  if (code === 0) return 'weather.clear';
  if (code <= 2) return 'weather.partly';
  if (code === 3) return 'weather.cloudy';
  if (code <= 48) return 'weather.fog';
  if (code <= 57) return 'weather.drizzle';
  if (code <= 67) return 'weather.rain';
  if (code <= 77) return 'weather.snow';
  if (code <= 82) return 'weather.showers';
  if (code <= 86) return 'weather.snowShowers';
  return 'weather.thunder';
};
