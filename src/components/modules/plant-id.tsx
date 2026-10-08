'use client';

/**
 * Pflanzenbestimmung ueber Google Lens - ganz ohne Schluessel.
 *
 * Lens oeffnet sich in einem neuen Tab; der gefundene Name wird hier
 * eingetragen und als Pflanzenart der Aussenanlage uebernommen.
 */
import { useState } from 'react';
import { Check, ExternalLink, Leaf } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/data/store';
import { toast } from 'sonner';

const LENS_URL = 'https://lens.google.com/';

export function PlantIdentifier({ areaId, plantSpecies }: { areaId: string; plantSpecies: string }) {
  const { update } = useCollection('outdoorAreas');
  const [name, setName] = useState('');

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
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Google Lens öffnen und Foto der Pflanze machen.</li>
          <li>Den gefundenen Namen hier eintragen.</li>
          <li>«Übernehmen» antippen – fertig.</li>
        </ol>
        <Button
          type="button"
          variant="outline"
          asChild
          data-testid="plant-id-lens"
        >
          <a href={LENS_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" aria-hidden />
            Mit Google Lens erkennen
          </a>
        </Button>
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
