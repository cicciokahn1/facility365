/** Öffentlicher VAPID-Schlüssel; darf im Browser verwendet werden. */
export const VAPID_PUBLIC_KEY =
  'BCkKSxerlEO2joT2TYXSDa31tKuJRl3SZpxLhQAdwQI7222BbBVHHGlVE4qyQsiqQevMvb-z5ubflTejBEjk0QU';

export const base64ToArrayBuffer = (value: string): ArrayBuffer => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};
