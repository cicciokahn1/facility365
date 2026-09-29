'use client';

import Link from 'next/link';
import { Download, ExternalLink, FileText, ShieldAlert } from 'lucide-react';

import { EntityDetail } from '@/components/module/entity-detail';
import { RecordQr } from '@/components/modules/record-qr';
import { Button } from '@/components/ui/button';
import { useCollectionItems } from '@/lib/data/store';
import { downloadDataUrl } from '@/lib/media';
import { useT } from '@/lib/i18n/provider';
import type { HazardousSubstance } from '@/lib/types';

export function HazardDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="hazards"
      id={id}
      defaultTab="safety"
      extraTabs={(hazard) => [
        {
          value: 'safety',
          labelKey: 'hazard.protectiveTitle',
          content: <HazardSafetyPanel hazard={hazard} />,
        },
        {
          value: 'qr',
          labelKey: 'tab.qr',
          content: (
            <RecordQr
              path={`/hazards/${hazard.id}`}
              number={hazard.number}
              title={hazard.name || hazard.productName}
            />
          ),
        },
      ]}
    />
  );
}

function HazardSafetyPanel({ hazard }: { hazard: HazardousSubstance }) {
  const t = useT();
  const documents = useCollectionItems('documents');
  const safetyDataSheet = documents.find((document) => document.id === hazard.safetyDataSheetId);
  const pictograms = hazard.hazardPictograms
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="size-4" aria-hidden />
          {t('hazard.protectiveTitle')}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {pictograms.length > 0 ? (
            pictograms.map((pictogram) => (
              <span key={pictogram} className="rounded-md border bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                {pictogram}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">{t('hazard.noMeasures')}</span>
          )}
        </div>
        <div className="mt-4 grid gap-3 text-sm">
          <SafetyText label={t('hazard.statements')} value={hazard.hazardStatements} />
          <SafetyText label={t('hazard.precautions')} value={hazard.precautionaryStatements} />
          <SafetyText label={t('hazard.protectiveMeasures')} value={hazard.protectiveMeasures} />
          <SafetyText label={t('hazard.firstAid')} value={hazard.firstAid} />
          <SafetyText label={t('hazard.storageInstructions')} value={hazard.storageInstructions} />
          <SafetyText label={t('hazard.disposalInstructions')} value={hazard.disposalInstructions} />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <FileText className="size-4" aria-hidden />
          {t('hazard.safetyTitle')}
        </h3>
        {safetyDataSheet?.file ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => downloadDataUrl(safetyDataSheet.file!.url, safetyDataSheet.file!.name)}>
              <Download className="size-4" aria-hidden />
              {t('hazard.downloadSheet')}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/documents/${safetyDataSheet.id}`}>
                <ExternalLink className="size-4" aria-hidden />
                {safetyDataSheet.title}
              </Link>
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{t('hazard.noSheet')}</p>
        )}
      </section>
    </div>
  );
}

function SafetyText({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="whitespace-pre-wrap text-muted-foreground">{value}</dd>
    </div>
  );
}
