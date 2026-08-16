'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, QrCode } from 'lucide-react';
import { toast } from 'sonner';

import { ModuleList } from '@/components/module/module-list';
import { AssetCardExport } from '@/components/modules/asset-card-export';
import { CodeScanner } from '@/components/modules/code-scanner';
import { Button } from '@/components/ui/button';
import { findAsset } from '@/lib/assets/passport';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';

export default function AssetsPage() {
  const t = useT();
  const router = useRouter();
  const assets = useCollectionItems('assets');
  /** ?scan=1 oeffnet den Scanner direkt, z. B. aus der QR-Ansicht einer Anlage. */
  const [scanning, setScanning] = useState(useSearchParams().get('scan') === '1');
  const [exporting, setExporting] = useState(false);

  /**
   * Der Code traegt die dauerhafte Anlagen-ID; aeltere Etiketten mit der
   * technischen Kennung oder der Seriennummer werden weiterhin erkannt.
   */
  const handleResult = (text: string) => {
    const match = findAsset(assets, text);
    if (match) router.push(`/assets/${match.number}`);
    else toast.error(t('scanner.noMatch'));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setExporting(true)} data-testid="card-export">
          <CreditCard className="size-4" aria-hidden />
          {t('asset.cardExport')}
        </Button>
        <Button variant="outline" onClick={() => setScanning(true)} data-testid="scan-button">
          <QrCode className="size-4" aria-hidden />
          {t('action.scan')}
        </Button>
      </div>
      <ModuleList collection="assets" />
      <CodeScanner open={scanning} onOpenChange={setScanning} onResult={handleResult} />
      <AssetCardExport open={exporting} onOpenChange={setExporting} />
    </div>
  );
}
