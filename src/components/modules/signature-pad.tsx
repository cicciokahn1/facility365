'use client';

/**
 * Unterschriftenfeld fuer Finger und Stift.
 *
 * Gezeichnet wird ueber Zeigerereignisse, damit Maus, Finger und Stift ohne
 * Sonderfaelle funktionieren. Das Ergebnis ist ein PNG als Data-URL.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

const RATIO = 0.42;

export function SignaturePad({
  onChange,
  disabled = false,
}: {
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  const prepare = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = Math.round(width * RATIO);
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.style.height = `${height}px`;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(scale, scale);
    context.lineWidth = 2.2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#0e3255';
  }, []);

  useEffect(() => {
    prepare();
    window.addEventListener('resize', prepare);
    return () => window.removeEventListener('resize', prepare);
  }, [prepare]);

  const pointOf = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const { x, y } = pointOf(event);
    context.beginPath();
    context.moveTo(x, y);
    /** Ein einzelner Tipp soll bereits einen sichtbaren Punkt hinterlassen. */
    context.lineTo(x + 0.1, y);
    context.stroke();
    setEmpty(false);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const { x, y } = pointOf(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
    onChange('');
  };

  return (
    <div className="flex flex-col gap-2" data-testid="signature-pad">
      <canvas
        ref={canvasRef}
        className="w-full touch-none rounded-xl border-2 border-dashed bg-background"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
        data-testid="signature-canvas"
        aria-label={t('report.signature')}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t('report.signHint')}</p>
        <Button
          variant="ghost"
          className="h-10"
          onClick={clear}
          disabled={empty}
          data-testid="signature-clear"
        >
          {t('report.signClear')}
        </Button>
      </div>
    </div>
  );
}
