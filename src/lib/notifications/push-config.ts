/** Öffentlicher VAPID-Schlüssel; darf im Browser verwendet werden. */
export const VAPID_PUBLIC_KEY =
  'BMFOcMBnET9KD0-_-Kl3E2OwkUc0EzvHdpQ-t7C1Mv9L_tBWtxuKv79znoqFImTUwJ_wFif-Qq4aKeoNiCuAUmA';

export const base64ToArrayBuffer = (value: string): ArrayBuffer => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};
