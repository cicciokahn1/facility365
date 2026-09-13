'use client';

/** „Erledigt“ im Kopf von Auftrag, Wartung und Schaden; ueberall gleich. */
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { CompletableKey, isDone, useMarkDone } from '@/lib/workflow/complete';

export function DoneButton({
  collection,
  id,
  status,
}: {
  collection: CompletableKey;
  id: string;
  status: string;
}) {
  const t = useT();
  const markDone = useMarkDone(collection);

  /** Abgeschlossenes bleibt abgeschlossen; der Knopf verschwindet dann. */
  if (isDone(collection, status)) return null;

  return (
    <Button
      size="lg"
      onClick={() => {
        markDone(id);
        toast.success(t('action.markedDone'), { description: t('action.doneHint') });
      }}
      data-testid="mark-done"
    >
      <CheckCircle2 className="size-4" aria-hidden />
      {t('action.markDone')}
    </Button>
  );
}
