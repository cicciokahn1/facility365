/** Logo in ein PDF zeichnen, ohne es zu verzerren. */
import type { jsPDF } from 'jspdf';

export interface LogoBox {
  x: number;
  y: number;
  /** Maximale Breite in Millimetern. */
  width: number;
  /** Maximale Hoehe in Millimetern. */
  height: number;
}

/**
 * Zeichnet das Logo in die Box und liefert die tatsaechlich belegte Hoehe.
 * Bleibt das Bild unlesbar, wird nichts gezeichnet und 0 gemeldet.
 */
export const drawLogo = (doc: jsPDF, logo: string, box: LogoBox): number => {
  try {
    const properties = doc.getImageProperties(logo);
    const ratio = properties.width / properties.height;
    const height = Math.min(box.height, box.width / ratio);
    const width = height * ratio;
    doc.addImage(logo, 'PNG', box.x, box.y, width, height, undefined, 'FAST');
    return height;
  } catch {
    return 0;
  }
};
