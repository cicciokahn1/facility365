'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, QrCode, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { ModuleList } from '@/components/module/module-list';
import { AssetCardExport } from '@/components/modules/asset-card-export';
import { QuickDamageDialog, QuickDamageTarget } from '@/components/modules/quick-damage-dialog';
import { Button } from '@/components/ui/button';
import { findAsset } from '@/lib/assets/passport';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';

/** Die Kamerabibliothek wird erst geladen, wenn der Scanner geoeffnet wird. */
const CodeScanner = dynamic(
  () => import('@/components/modules/code-scanner').then((module) => module.CodeScanner),
  { ssr: false },
);

export default function AssetsPage() {
  const t = useT();
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
