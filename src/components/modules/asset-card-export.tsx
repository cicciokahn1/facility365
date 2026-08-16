'use client';

/** Sammelexport: mehrere Anlagen als ein mehrseitiges A6-PDF. */
import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAssetCards } from '@/lib/assets/use-asset-cards';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { Asset } from '@/lib/types';

export function AssetCardExport({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const assets = useCollectionItems('assets');
  const { downloadCards, printCards } = useAssetCards();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );

  const allSelected = assets.length > 0 && selected.length === assets.length;

  const run = async (action: (items: Asset[]) => Promise<void>) => {
    const items = assets.filter((asset) => selected.includes(asset.id));
    if (items.length === 0) return;
    setBusy(true);
    try {
      await action(items);
      toast.success(t('asset.cardCreated'));
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="card-export-dialog">
        <DialogHeader>
          <DialogTitle>{t('asset.cardExport')}</DialogTitle>
          <DialogDescription>{t('asset.cardExportHint')}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Checkbox
            id="card-export-all"
            checked={allSelected}
            onCheckedChange={(value) => setSelected(value === true ? assets.map((a) => a.id) : [])}
            data-testid="card-export-all"
          />
          <label htmlFor="card-export-all" className="text-sm">
            {t('asset.selectAll')}
          </label>
          <span className="ml-auto text-xs text-muted-foreground" data-testid="card-export-count">
            {selected.length} {t('asset.selected')}
          </span>
        </div>

        <ScrollArea className="max-h-72 rounded-xl border">
          <ul className="divide-y">
            {assets.map((asset) => (
              <li key={asset.id} className="flex items-center gap-3 p-3">
                <Checkbox
                  id={`card-${asset.id}`}
                  checked={selected.includes(asset.id)}
                  onCheckedChange={() => toggle(asset.id)}
                  data-testid="card-export-item"
                />
                <label htmlFor={`card-${asset.id}`} className="min-w-0 flex-1">
                  <span className="block font-mono text-xs text-muted-foreground">
                    {asset.number}
                  </span>
                  <span className="block truncate text-sm font-medium">{asset.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={busy || selected.length === 0}
            onClick={() => void run(printCards)}
            data-testid="card-export-print"
          >
            <Printer className="size-4" aria-hidden />
            {t('action.print')}
          </Button>
          <Button
            disabled={busy || selected.length === 0}
            onClick={() => void run(downloadCards)}
            data-testid="card-export-download"
          >
            <Download className="size-4" aria-hidden />
            {t('action.download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
