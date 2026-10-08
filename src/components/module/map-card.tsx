'use client';

import { MapPin, Navigation } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/lib/i18n/provider';
import { addressText, mapsDirectionsUrl, mapsEmbedUrl, mapsSearchUrl } from '@/lib/maps';
import type { Address } from '@/lib/types';

/** Karte und Navigation zu einer Adresse, in Liegenschaft, Lieferant und Co. */
export function MapCard({ address }: { address?: Partial<Address> }) {
  const t = useT();
  const query = addressText(address);
  if (!query) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          {t('map.noAddress')}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="size-4 text-primary" aria-hidden />
          {query}
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={mapsSearchUrl(query)} target="_blank" rel="noreferrer">
              {t('map.open')}
            </a>
          </Button>
          <Button size="sm" asChild data-testid="map-navigate">
            <a href={mapsDirectionsUrl(query)} target="_blank" rel="noreferrer">
              <Navigation className="size-4" aria-hidden />
              {t('map.navigate')}
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <iframe
          title={query}
          src={mapsEmbedUrl(query)}
          className="h-72 w-full rounded-md border"
          loading="lazy"
        />
      </CardContent>
    </Card>
  );
}

/** Route-Button fuer den Kopf eines Datensatzes. */
export function NavigateButton({ address }: { address?: Partial<Address> }) {
  const t = useT();
  const query = addressText(address);
  if (!query) return null;
  return (
    <Button size="sm" variant="outline" asChild>
      <a href={mapsDirectionsUrl(query)} target="_blank" rel="noreferrer">
        <Navigation className="size-4" aria-hidden />
        {t('map.navigate')}
      </a>
    </Button>
  );
}
