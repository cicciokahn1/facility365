'use client';

import { MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { addressText, mapsRouteUrl } from '@/lib/maps';

/** Alle Liegenschaften als Route auf einer Google-Karte. */
export function PropertiesMapLink() {
  const t = useT();
  const properties = useCollectionItems('properties');
  const url = mapsRouteUrl(
    properties.map((property) => addressText(property.address)),
  );
  if (!url) return null;
  return (
    <Button size="lg" variant="outline" asChild>
      <a href={url} target="_blank" rel="noreferrer">
        <MapPin className="size-4" aria-hidden />
        {t('map.allProperties')}
      </a>
    </Button>
  );
}
