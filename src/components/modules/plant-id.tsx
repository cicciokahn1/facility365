'use client';

/**
 * Pflanzenbestimmung ohne Schluessel.
 *
 * Das Foto kann direkt an Google Lens oder eine andere Erkennungsapp geteilt
 * werden; auf dem iPhone genuegt auch ein langer Fingerdruck aufs Foto
 * («Pflanze bestimmen»). Der gefundene Name wird als Pflanzenart uebernommen.
 */
import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Leaf, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/data/store';
import { compressImage } from '@/lib/media';
import { toast } from 'sonner';

export function PlantIdentifier({ areaId, plantSpecies }: { areaId: string; plantSpecies: string }) {
  const { update } = useCollection('outdoorAreas');
  const [name, setName] = useState('');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [shareable, setShareable] = useState(false);
  const photo = useRef<HTMLInputElement>(null);
  const file = useRef<File | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const prepare = async (picked: File | undefined) => {
    if (!picked) return;
    setBusy(true);
    try {
      const { url } = await compressImage(picked);
      const blob = await (await fetch(url)).blob();
      file.current = new File([blob], 'pflanze.jpg', { type: 'image/jpeg' });
      setShareable(
        typeof navigator !== 'undefined' &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [file.current] }),
      );
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file.current));
    } catch {
      toast.error('Foto konnte nicht gelesen werden');
      file.current = null;
      setPreview('');
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!file.current) return;
    try {
      await navigator.share({ files: [file.current], title: 'Pflanze bestimmen' });
    } catch {
      // Abgebrochen
    }
  };

  const adopt = () => {
    const value = name.trim();
    if (!value) return;
    update(areaId, { plantSpecies: value });
    setName('');
    toast.success('Pflanzenart übernommen');
  };

  return (
    <Card data-testid="plant-id">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Leaf className="size-4 text-primary" aria-hidden />
          Pflanze erkennen
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {plantSpecies ? (
          <p className="text-sm">
            <span className="text-muted-foreground">Pflanzenart: </span>
            <strong>{plantSpecies}</strong>
          </p>
        ) : null}
        <input
          ref={photo}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          data-testid="plant-id-photo"
          onChange={(event) => void prepare(event.target.files?.[0])}
        />
        <Button
          type="button"
          size="lg"
          variant={preview ? 'outline' : 'default'}
          onClick={() => photo.current?.click()}
          disabled={busy}
          data-testid="plant-id-camera"
        >
          <Camera className="size-5" aria-hidden />
          {preview ? 'Neues Foto' : '1. Foto machen'}
        </Button>
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Pflanzenfoto"
              className="max-h-48 w-full rounded-md object-cover"
            />
            {shareable ? (
              <Button
                type="button"
                size="lg"
                onClick={() => void share()}
                data-testid="plant-id-share"
              >
                <Share2 className="size-5" aria-hidden />
                2. Foto an Google Lens senden
              </Button>
            ) : null}
            <p className="text-xs text-muted-foreground">
              iPhone: Foto lange gedrückt halten → «Pflanze bestimmen». Sonst:
              «Foto an Google Lens senden» → Google oder Lens wählen. Den
              gefundenen Namen unten eintragen und «Übernehmen» antippen.
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nach dem Foto: lange draufhalten → «Pflanze bestimmen», oder an
            Google Lens teilen. Den Namen unten eintragen.
          </p>
        )}
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Pflanzenname eintragen…"
            data-testid="plant-id-name"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                adopt();
              }
            }}
          />
          <Button
            type="button"
            onClick={adopt}
            disabled={!name.trim()}
            data-testid="plant-id-adopt"
          >
            <Check className="size-4" aria-hidden />
            Übernehmen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
