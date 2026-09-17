'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, FileDown, QrCode, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { ModuleList } from '@/components/module/module-list';
import { AssetCardExport } from '@/components/modules/asset-card-export';
import { QuickDamageDialog, QuickDamageTarget } from '@/components/modules/quick-damage-dialog';
import { Button } from '@/components/ui/button';
import { findAsset } from '@/lib/assets/passport';
import type { AuditPdfLabels } from '@/lib/audit/audit-pdf';
import { logoOf } from '@/lib/branding/logo';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { formatDate } from '@/lib/utils/format';

/** Die Kamerabibliothek wird erst geladen, wenn der Scanner geoeffnet wird. */
const CodeScanner = dynamic(
  () => import('@/components/modules/code-scanner').then((module) => module.CodeScanner),
  { ssr: false },
);

export default function AssetsPage() {
  const t = useT();
  const { settings } = useSettings();
  const router = useRouter();
  const assets = useCollectionItems('assets');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  /**
   * ?scan=1 oeffnet den Scanner direkt, z. B. aus der QR-Ansicht einer Anlage;
   * ?scan=report fuehrt danach unmittelbar in die Schadensmeldung.
   */
  const scanParam = useSearchParams().get('scan');
  const [scanning, setScanning] = useState(scanParam === '1' || scanParam === 'report');
  const [exporting, setExporting] = useState(false);
  /** Erst nach dem ersten Oeffnen bleibt der Scanner eingehaengt. */
  const [scannerUsed, setScannerUsed] = useState(scanning);
  /** Wahr, wenn der Scan in die Schadensmeldung fuehren soll statt in die Anlage. */
  const [reportMode, setReportMode] = useState(scanParam === 'report');
  const [target, setTarget] = useState<QuickDamageTarget | null>(null);

  const exportPdf = async () => {
    const labels: AuditPdfLabels = {
      title: t('module.assets'),
      location: t('audit.location'),
      period: t('audit.period'),
      createdAt: t('common.date'),
      summary: t('audit.summary'),
      green: t('audit.green'),
      amber: t('audit.amber'),
      red: t('audit.red'),
      number: t('common.number'),
      subject: t('common.title'),
      date: t('common.date'),
      status: t('common.status'),
      empty: t('list.empty'),
    };
    const { downloadAuditPdf } = await import('@/lib/audit/audit-pdf');
    const tableRows = assets.map((asset) => [
      asset.number,
      asset.name,
      asset.conditionStatus
        ? t(`asset.conditionStatus.${asset.conditionStatus}` as Parameters<typeof t>[0])
        : '–',
      properties.find((entry) => entry.id === asset.propertyId)?.name ?? '–',
      buildings.find((entry) => entry.id === asset.buildingId)?.name ?? '–',
      rooms.find((entry) => entry.id === asset.roomId)?.name ?? '–',
      asset.plannedReplacementYear || '–',
    ]);
    downloadAuditPdf(
      {
        location: t('audit.allLocations'),
        period: formatDate(new Date().toISOString(), settings.language),
        createdAt: formatDate(new Date().toISOString(), settings.language),
        green: 0,
        amber: 0,
        red: 0,
        showSummary: false,
        fileBaseName: 'Anlagenliste',
        sections: [],
        tables: [
          {
            title: t('module.assets'),
            head: [
              t('common.number'),
              t('common.title'),
              t('asset.conditionStatus'),
              t('module.properties.singular'),
              t('module.buildings.singular'),
              t('module.rooms.singular'),
              t('asset.renewalDate'),
            ],
            rows: tableRows,
          },
        ],
      },
      labels,
      {
        companyName: settings.companyName || 'Facility365',
        companyAddress: [
          settings.companyAddress.street,
          [settings.companyAddress.zip, settings.companyAddress.city].filter(Boolean).join(' '),
        ].filter(Boolean).join(', '),
        companyContact: [settings.companyPhone, settings.companyEmail].filter(Boolean).join(' · '),
        logo: logoOf(settings.companyLogo),
      },
    );
  };

  const openScanner = (report: boolean) => {
    setReportMode(report);
    setScannerUsed(true);
    setScanning(true);
  };

  /**
   * Der Code traegt die dauerhafte Anlagen-ID; aeltere Etiketten mit der
   * technischen Kennung oder der Seriennummer werden weiterhin erkannt.
   */
  const handleResult = useCallback(
    (text: string) => {
      const match = findAsset(assets, text);
      if (!match) {
        toast.error(t('scanner.noMatch'));
        return;
      }
      if (!reportMode) {
        router.push(`/assets/${match.number}`);
        return;
      }
      setTarget({
        title: match.name || match.number,
        location: [
          properties.find((entry) => entry.id === match.propertyId)?.name,
          buildings.find((entry) => entry.id === match.buildingId)?.name,
          rooms.find((entry) => entry.id === match.roomId)?.name,
          match.location,
        ]
          .filter(Boolean)
          .join(' · '),
        propertyId: match.propertyId,
        buildingId: match.buildingId,
        roomId: match.roomId,
        assetId: match.id,
      });
    },
    [assets, buildings, properties, reportMode, rooms, router, t],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setExporting(true)} data-testid="card-export">
          <CreditCard className="size-4" aria-hidden />
          {t('asset.cardExport')}
        </Button>
        <Button variant="outline" onClick={() => void exportPdf()} data-testid="asset-pdf-export">
          <FileDown className="size-4" aria-hidden />
          {t('asset.listPdf')}
        </Button>
        <Button variant="outline" onClick={() => openScanner(true)} data-testid="scan-report-button">
          <TriangleAlert className="size-4" aria-hidden />
          {t('quickReport.scan')}
        </Button>
        <Button variant="outline" onClick={() => openScanner(false)} data-testid="scan-button">
          <QrCode className="size-4" aria-hidden />
          {t('action.scan')}
        </Button>
      </div>
      <ModuleList collection="assets" />
      {scannerUsed ? (
        <CodeScanner open={scanning} onOpenChange={setScanning} onResult={handleResult} />
      ) : null}
      <QuickDamageDialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        target={target}
      />
      <AssetCardExport open={exporting} onOpenChange={setExporting} />
    </div>
  );
}
