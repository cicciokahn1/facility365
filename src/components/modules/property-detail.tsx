'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { LinkedMails } from '@/components/module/linked-mails';
import { RelatedList } from '@/components/module/related-list';
import { AreaOverview } from '@/components/modules/area-overview';
import { PlanManager } from '@/components/modules/plan-manager';
import { MapCard, NavigateButton } from '@/components/module/map-card';
import { TenantReportQr } from '@/components/modules/tenant-report-qr';
import { WalkthroughQr } from '@/components/modules/walkthrough-qr';
import { TenantNotice } from '@/components/modules/tenant-notice';
import { YearReport } from '@/components/modules/year-report';

export function PropertyDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="properties"
      id={id}
      defaultTab="dossier"
      headerExtra={(property) => <NavigateButton address={property.address} />}
      extraTabs={(property, update) => [
        {
          value: 'map',
          labelKey: 'tab.map',
          content: <MapCard address={property.address} />,
        },
        {
          value: 'buildings',
          labelKey: 'module.buildings',
          content: <RelatedList collection="buildings" field="propertyId" value={property.id} />,
        },
        {
          value: 'areas',
          labelKey: 'tab.areas',
          content: <AreaOverview level="properties" id={property.id} />,
        },
        {
          value: 'plans',
          labelKey: 'tab.plans',
          content: <PlanManager plans={property.plans} onChange={(plans) => update({ plans })} />,
        },
        {
          value: 'assets',
          labelKey: 'module.assets',
          content: <RelatedList collection="assets" field="propertyId" value={property.id} />,
        },
        {
          value: 'orders',
          labelKey: 'module.orders',
          content: <RelatedList collection="orders" field="propertyId" value={property.id} />,
        },
        {
          value: 'damages',
          labelKey: 'module.damages',
          content: <RelatedList collection="damages" field="propertyId" value={property.id} />,
        },
        {
          value: 'yearReport',
          labelKey: 'yearReport.kind',
          content: <YearReport property={property} />,
        },
        {
          value: 'tenantReport',
          labelKey: 'tab.tenantReport',
          content: (
            <div className="grid gap-4">
              <TenantReportQr property={property} />
              <WalkthroughQr property={property} />
              <TenantNotice property={property} />
            </div>
          ),
        },
        {
          value: 'mails',
          labelKey: 'tab.mails',
          content: (
            <LinkedMails
              mails={property.mailLinks}
              onRemove={(mail) =>
                update({
                  mailLinks: (property.mailLinks ?? []).filter(
                    (item) => item.messageId !== mail.messageId,
                  ),
                })
              }
            />
          ),
        },
      ]}
    />
  );
}
