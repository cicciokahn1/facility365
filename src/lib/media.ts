/**
 * Fotos und Dateien.
 *
 * Bilder werden vor dem Speichern verkleinert: die Daten liegen heute im
 * Browser, und ein unbearbeitetes Telefonfoto wuerde den Platz allein fuellen.
 */
import { DocumentFile, Photo } from '@/lib/types';
import { newId } from '@/lib/utils/id';

export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic';
export const DOCUMENT_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.docx,.xlsx,application/pdf,image/jpeg,image/png,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const PLAN_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
/** Dokumente an Objekten: PDF, JPG und PNG. */
export const LINKED_DOCUMENT_ACCEPT = PLAN_ACCEPT;

const DOCUMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'];
const PLAN_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

/** Laengste Bildkante nach dem Verkleinern. */
const PHOTO_EDGE = 1600;
const PHOTO_QUALITY = 0.82;

export const MAX_FILE_BYTES = 4 * 1024 * 1024;

export const extensionOf = (fileName: string): string =>
  fileName.split('.').pop()?.toLowerCase() ?? '';

export const isAllowedDocument = (file: File): boolean =>
  DOCUMENT_EXTENSIONS.includes(extensionOf(file.name));

export const isAllowedPlan = (file: File): boolean =>
  PLAN_EXTENSIONS.includes(extensionOf(file.name));

export const isLinkedDocument = isAllowedPlan;

export const isPdf = (mimeType: string, fileName = ''): boolean =>
  mimeType === 'application/pdf' || extensionOf(fileName) === 'pdf';

export const isImage = (mimeType: string, fileName = ''): boolean =>
  mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(extensionOf(fileName));

const readAsDataUrl = (file: File | Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsDataURL(file);
  });

/** Bild verkleinern; bei Fehlern wird das Original unveraendert uebernommen. */
export const compressImage = async (file: File): Promise<{ url: string; size: number }> => {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PHOTO_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('no-context');
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const url = canvas.toDataURL('image/jpeg', PHOTO_QUALITY);
    return { url, size: Math.round((url.length * 3) / 4) };
  } catch {
    const url = await readAsDataUrl(file);
    return { url, size: file.size };
  }
};

export const photoFromFile = async (file: File): Promise<Photo> => {
  const { url, size } = await compressImage(file);
  return {
    id: newId('photo'),
    url,
    name: file.name,
    takenAt: new Date().toISOString(),
    size,
  };
};

export const documentFromFile = async (file: File, uploadedBy: string): Promise<DocumentFile> => {
  const url = await readAsDataUrl(file);
  return {
    id: newId('doc'),
    name: file.name,
    type: extensionOf(file.name).toUpperCase(),
    mimeType: file.type || 'application/octet-stream',
    url,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };
};

export const fileToDataUrl = readAsDataUrl;

/** Data-URL als Datei speichern. */
export const downloadDataUrl = (url: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/** Data-URL fuer die Anzeige in einem Rahmen (PDF) in eine Blob-Adresse wandeln. */
export const dataUrlToBlobUrl = (dataUrl: string, mimeType: string): string | null => {
  const base64 = dataUrl.split(',')[1];
  if (!base64) return null;
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  } catch {
    return null;
  }
};
