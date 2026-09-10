'use client';

/**
 * QR-Scannen aus jeder Ansicht heraus.
 *
 * Der Knopf steht in der Kopfzeile, damit unterwegs kein Umweg ueber das
 * Anlagenmodul noetig ist. Die Kamerabibliothek laedt erst beim Oeffnen.
 */
import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { resolveScan } from '@/lib/qr/resolve';

const CodeScanner = dynamic(
  () => import('@/components/modules/code-scanner').then((module) => module.CodeScanner),
  { ssr: false },
);

export function ScanButton() {
  const t = useT();
  const router = useRouter();
  const assets = useCollectionItems('assets');
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);

  const handleResult = useCallback(
    (text: string) => {
      const target = resolveScan(text, assets);
      if (!target) {
        toast.error(t('scanner.noMatch'));
        return;
      }
      router.push(target);
    },
    [assets, router, t],
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-9"
        aria-label={t('action.scan')}
        data-testid="header-scan"
        onClick={() => {
          setUsed(true);
          setOpen(true);
        }}
      >
        <QrCode className="size-5" aria-hidden />
      </Button>
      {used ? <CodeScanner open={open} onOpenChange={setOpen} onResult={handleResult} /> : null}
    </>
  );
}
