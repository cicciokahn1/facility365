'use client';

/** «Kunde unterschreiben» am Auftrag: Unterschrift direkt am Geraet. */
import { useState } from 'react';
import { PenLine } from 'lucide-react';
import { toast } from 'sonner';

import { SignaturePad } from '@/components/modules/signature-pad';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n/provider';
import { Order } from '@/lib/types';

export function OrderSignDialog({
  order,
  onChange,
}: {
  order: Order;
  onChange: (values: Partial<Order>, action?: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [drawing, setDrawing] = useState('');
  const [name, setName] = useState(order.signedBy);

  const confirm = () => {
    if (!drawing || !name.trim()) {
      toast.error(t('report.signMissing'));
      return;
    }
    onChange({ signature: drawing, signedBy: name.trim() }, 'history.signed');
    setDrawing('');
    toast.success(t('report.signedDone'));
    setOpen(false);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} data-testid="order-sign">
        <PenLine className="size-4" aria-hidden />
        {order.signature ? t('report.signAgain') : t('report.signCustomer')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('report.signCustomer')}</DialogTitle>
            <DialogDescription>{t('report.signDialogHint')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-signer-name">{t('report.signerName')}</Label>
              <Input
                id="order-signer-name"
                className="h-11"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <SignaturePad onChange={setDrawing} />
            <Button className="h-12 text-base" onClick={confirm}>
              {t('report.signConfirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
