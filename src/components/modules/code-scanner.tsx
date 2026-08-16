'use client';

/**
 * QR- und Strichcode-Scanner.
 *
 * Die Kamera wird bewusst hoch aufgeloest angefordert: bei 640×480 bleiben von
 * einem Strichcode zu wenige Bildpunkte je Strich uebrig, um ihn zu lesen.
 */
import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import type { IScannerControls } from '@zxing/browser';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useT } from '@/lib/i18n/provider';

const FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.DATA_MATRIX,
];

export function CodeScanner({
  open,
  onOpenChange,
  onResult,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (text: string) => void;
}) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    let controls: IScannerControls | null = null;
    let cancelled = false;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled || !video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        controls = await reader.decodeFromVideoElement(video, (result) => {
          if (result) {
            onResult(result.getText());
            onOpenChange(false);
          }
        });
      } catch {
        if (!cancelled) setError(t('scanner.noCamera'));
      }
    };

    void start();
    return () => {
      cancelled = true;
      controls?.stop();
      const stream = video?.srcObject;
      if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [open, onOpenChange, onResult, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="scanner">
        <DialogTitle>{t('action.scan')}</DialogTitle>
        <DialogDescription>{t('scanner.hint')}</DialogDescription>
        {error ? (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        ) : (
          <video ref={videoRef} className="w-full rounded-lg bg-black" muted playsInline />
        )}
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t('action.close')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
