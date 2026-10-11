/** PDF oeffnen, herunterladen oder ueber das Teilen-Menue des Geraets weitergeben. */
import type { jsPDF } from 'jspdf';

export const openPdf = (doc: jsPDF): void => {
  window.open(doc.output('bloburl'), '_blank');
};

export const downloadPdf = (doc: jsPDF, fileName: string): void => {
  doc.save(fileName);
};

export const printPdf = (doc: jsPDF): void => {
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

/**
 * Teilt die Datei, wo das Geraet es kann (Smartphone, Safari, Edge);
 * sonst wird sie heruntergeladen.
 */
export const sharePdf = async (doc: jsPDF, fileName: string, title: string): Promise<void> => {
  const file = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  doc.save(fileName);
};
