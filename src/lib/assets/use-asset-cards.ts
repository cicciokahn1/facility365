'use client';

/** A6-Karten aus den aktuellen Anlagendaten erzeugen, herunterladen und drucken. */
import { useCallback } from 'react';

import type { CardAsset, CardBranding, CardLabels } from '@/lib/assets/card-pdf';
import { logoOf } from '@/lib/branding/logo';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { Asset } from '@/lib/types';

/** QR-Code und PDF werden erst beim Klick geladen, nicht beim Oeffnen der Seite. */
const cardModule = () => import('@/lib/assets/card-pdf');

export interface AssetCardsApi {
  downloadCards: (assets: Asset[]) => Promise<void>;
  printCards: (assets: Asset[]) => Promise<void>;
}

export function useAssetCards(): AssetCardsApi {
  const t = useT();
  const { settings } = useSettings();
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');

  const toCard = useCallback(
    (asset: Asset): CardAsset => ({
      number: asset.number,
      name: asset.name,
      location: asset.location || properties.find((entry) => entry.id === asset.propertyId)?.name || '',
      building: buildings.find((entry) => entry.id === asset.buildingId)?.name ?? '',
      room: rooms.find((entry) => entry.id === asset.roomId)?.name ?? '',
      manufacturer: asset.manufacturer,
      model: asset.model,
      serialNumber: asset.serialNumber,
    }),
    [buildings, properties, rooms],
  );

  const labels = useCallback(
    (): CardLabels => ({
      id: t('asset.id'),
      location: t('common.location'),
      building: t('module.buildings.singular'),
      room: t('module.rooms.singular'),
      manufacturer: t('asset.manufacturer'),
      model: t('asset.model'),
      serial: t('asset.serial'),
      hint: t('asset.cardHint'),
    }),
    [t],
  );

  const branding = useCallback(
    (): CardBranding => ({
      companyName: settings.companyName || 'Facility365',
      logo: logoOf(settings.companyLogo),
    }),
    [settings.companyLogo, settings.companyName],
  );

  const downloadCards = useCallback(
    async (assets: Asset[]) => {
      const { downloadAssetCards } = await cardModule();
      await downloadAssetCards(assets.map(toCard), labels(), branding());
    },
    [branding, labels, toCard],
  );

  const printCards = useCallback(
    async (assets: Asset[]) => {
      const { printAssetCards } = await cardModule();
      await printAssetCards(assets.map(toCard), labels(), branding());
    },
    [branding, labels, toCard],
  );

  return { downloadCards, printCards };
}
