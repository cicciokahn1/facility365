/**
 * Google Maps ohne Schluessel.
 *
 * Alle Links nutzen die oeffentlichen Maps-Adressen; auf dem Telefon
 * oeffnet sich damit direkt die Navigation.
 */
import type { Address } from '@/lib/types';

export const addressText = (address?: Partial<Address>): string =>
  [
    address?.street,
    [address?.zip, address?.city].filter(Boolean).join(' '),
    address?.country,
  ]
    .filter(Boolean)
    .join(', ');

export const mapsSearchUrl = (address: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export const mapsDirectionsUrl = (address: string): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

export const mapsEmbedUrl = (address: string): string =>
  `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

/** Route ueber mehrere Liegenschaften; der erste Eintrag dient als Start. */
export const mapsRouteUrl = (addresses: string[]): string => {
  const list = addresses.filter(Boolean);
  if (list.length === 0) return '';
  const start = list[0];
  const end = list.length > 1 ? list[list.length - 1] : start;
  const mid = list.slice(1, -1);
  const waypoints = mid.length
    ? `&waypoints=${encodeURIComponent(mid.join('|'))}`
    : '';
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}${waypoints}`;
};
