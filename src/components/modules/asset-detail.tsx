'use client';

/**
 * Anlagendetail mit digitalem Anlagenpass.
 *
 * Der Bezeichner in der Adresse darf die Anlagen-ID (ANL-000123), die
 * Seriennummer oder die technische Kennung sein; damit bleiben auch aeltere
 * gedruckte Etiketten gueltig.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { AssetDocuments } from '@/components/modules/asset-documents';
import { AssetPassport } from '@/components/modules/asset-passport';
import { AssetServiceHistory } from '@/components/modules/asset-service-history';
import { PlanLocation } from '@/components/modules/plan-location';
import { PlanManager } from '@/components/modules/plan-manager';
import { QrPanel } from '@/components/modules/qr-panel';
import { findAsset } from '@/lib/assets/passport';
import { useCollectionItems } from '@/lib/data/store';
import { Asset, DocumentFile, Plan } from '@/lib/types';

/** Eigene Plaene der Anlage plus die Plaene, auf denen sie markiert ist. */
function AssetPlans({
  asset,
  onChange,
}: {
  asset: Asset;
  onChange: (plans: Plan[]) => void;
}) {
  return (
    <div className="grid gap-4">
      <PlanManager plans={asset.plans ?? []} onChange={onChange} />
      <PlanLocation assetId={asset.id} hideEmpty />
    </div>
  );
}

export function AssetDetail({ id }: { id: string }) {
  const router = useRouter();
  const assets = useCollectionItems('assets');
  const asset = findAsset(assets, id);
  const resolved = asset?.id ?? id;
  const number = asset?.number;

  /** Die Adresse zeigt immer die dauerhafte Anlagen-ID, egal womit sie geoeffnet wurde. */
  useEffect(() => {
    if (number && number !== id) router.replace(`/assets/${number}`);
  }, [id, number, router]);

  return (
    <EntityDetail
      collection="assets"
      id={resolved}
      defaultTab="dossier"
      extraTabs={(asset, update) => [
        {
          value: 'passport',
          labelKey: 'tab.passport',
          content: <AssetPassport asset={asset} onChange={(values) => update(values as Partial<Asset>, 'asset.locationChanged')} />,
        },
        {
          value: 'service',
          labelKey: 'tab.service',
          content: <AssetServiceHistory asset={asset} />,
        },
        // Unteranlagen und Photovoltaik brauchen keinen Plan-Tab.
        ...(asset.parentAssetId
          ? []
          : [
              {
                value: 'plan',
                labelKey: 'tab.plans' as const,
                content: (
                  <AssetPlans
                    asset={asset}
                    onChange={(plans) => update({ plans } as Partial<Asset>, 'asset.plansChanged')}
                  />
                ),
              },
            ]),
        {
          value: 'qr',
          labelKey: 'tab.qr',
          content: <QrPanel asset={asset} />,
        },
        {
          value: 'assetDocuments',
          labelKey: 'documents.category.serviceReport',
          content: (
            <AssetDocuments
              asset={asset}
              onChange={(documents: DocumentFile[], action) =>
                update({ documents } as Partial<Asset>, action)
              }
            />
          ),
        },
        {
          value: 'maintenances',
          labelKey: 'module.maintenances',
          content: <RelatedList collection="maintenances" field="assetId" value={asset.id} />,
        },
        {
          value: 'damages',
          labelKey: 'module.damages',
          content: <RelatedList collection="damages" field="assetId" value={asset.id} />,
        },
        {
          value: 'orders',
          labelKey: 'module.orders',
          content: <RelatedList collection="orders" field="assetId" value={asset.id} />,
        },
        {
          value: 'subassets',
          labelKey: 'asset.subassets',
          content: <RelatedList collection="assets" field="parentAssetId" value={asset.id} />,
        },
        {
          value: 'solarplants',
          labelKey: 'module.solarplants',
          content: <RelatedList collection="solarplants" field="assetId" value={asset.id} />,
        },
      ]}
    />
  );
}
