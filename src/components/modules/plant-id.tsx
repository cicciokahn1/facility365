'use client';

/**
 * Pflanzenbestimmung ueber Google Lens - ganz ohne Schluessel.
 *
 * Das Foto wird direkt an Google Lens geschickt; der gefundene Name wird hier
 * eingetragen und als Pflanzenart der Aussenanlage uebernommen.
 */
import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Leaf, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/data/store';
import { compressImage } from '@/lib/media';
import { toast } from 'sonner';

const LENS_UPLOAD_URL = 'https://lens.google.com/v3/upload?hl=de&ep=gisbubb';

export function PlantIdentifier({ areaId, plantSpecies }: { areaId: string; plantSpecies: string }) {
  const { update } = useCollection('outdoorAreas');
  const [name, setName] = useState('');
  const [preview, setPreview] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const photo = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const prepare = async (file: File | undefined) => {
    if (!file || !upload.current) {
      setPreview('');
      return;
    }
    setBusy(true);
    try {
      const { url } = await compressImage(file);
      const blob = await (await fetch(url)).blob();
      const jpeg = new File([blob], 'pflanze.jpg', { type: 'image/jpeg' });
      const transfer = new DataTransfer();
      transfer.items.add(jpeg);
      upload.current.files = transfer.files;
      setPreview(URL.createObjectURL(jpeg));
    } catch {
      toast.error('Foto konnte nicht gelesen werden');
      setPreview('');
    } finally {
      setBusy(false);
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
        <form
          ref={form}
          action={LENS_UPLOAD_URL}
          method="post"
          encType="multipart/form-data"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col gap-3"
        >
          <input
            ref={photo}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            data-testid="plant-id-photo"
            onChange={(event) => void prepare(event.target.files?.[0])}
          />
          <input ref={upload} type="file" name="encoded_image" className="sr-only" tabIndex={-1} aria-hidden />
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
              <Button
                type="button"
                size="lg"
                onClick={() => form.current?.submit()}
                data-testid="plant-id-lens"
              >
                <Search className="size-5" aria-hidden />
                2. Google Lens fragen
              </Button>
            </>
          ) : null}
        </form>
        <p className="text-xs text-muted-foreground">
          Google zeigt den Namen. Hier eintragen und «Übernehmen» antippen.
        </p>
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
