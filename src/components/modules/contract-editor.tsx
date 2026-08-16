'use client';

/** Vertraege eines Kunden. */
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { Contract } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { newId } from '@/lib/utils/id';

const emptyContract = (): Contract => ({
  id: '',
  title: '',
  type: '',
  start: '',
  end: '',
  note: '',
});

export function ContractEditor({
  contracts,
  onChange,
}: {
  contracts: Contract[];
  onChange: (contracts: Contract[]) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const [draft, setDraft] = useState<Contract | null>(null);

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    onChange(
      draft.id
        ? contracts.map((entry) => (entry.id === draft.id ? draft : entry))
        : [...contracts, { ...draft, id: newId('contract') }],
    );
    setDraft(null);
  };

  return (
    <section className="flex flex-col gap-3" data-testid="contract-editor">
      <div>
        <Button variant="outline" onClick={() => setDraft(emptyContract())} data-testid="contract-add">
          <Plus className="size-4" aria-hidden />
          {t('customer.addContract')}
        </Button>
      </div>

      {contracts.length === 0 ? (
        <EmptyState titleKey="customer.noContracts" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {contracts.map((contract) => (
            <li key={contract.id} className="flex items-center gap-3 p-3" data-testid="contract-item">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => setDraft(contract)}
              >
                <span className="block truncate text-sm font-medium">{contract.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {[contract.type, contract.start ? formatDate(contract.start, settings.language) : '']
                    .filter(Boolean)
                    .join(' · ')}
                  {contract.end ? ` – ${formatDate(contract.end, settings.language)}` : ''}
                </span>
              </button>
              {typeof contract.amount === 'number' ? (
                <span className="text-sm font-medium">
                  {formatMoney(contract.amount, settings.currency)}
                </span>
              ) : null}
              <Button
                size="icon"
                variant="ghost"
                aria-label={t('action.delete')}
                onClick={() => onChange(contracts.filter((entry) => entry.id !== contract.id))}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('customer.addContract')}</DialogTitle>
            <DialogDescription className="sr-only">{t('customer.addContract')}</DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label>{t('common.title')}</Label>
                <Input
                  data-testid="contract-title"
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('common.type')}</Label>
                <Input
                  value={draft.type}
                  onChange={(event) => setDraft({ ...draft, type: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('common.amount')}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={draft.amount ?? ''}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      amount: event.target.value === '' ? undefined : Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('customer.contractStart')}</Label>
                <Input
                  type="date"
                  value={draft.start}
                  onChange={(event) => setDraft({ ...draft, start: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('customer.contractEnd')}</Label>
                <Input
                  type="date"
                  value={draft.end}
                  onChange={(event) => setDraft({ ...draft, end: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label>{t('common.notes')}</Label>
                <Textarea
                  rows={3}
                  value={draft.note}
                  onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              {t('action.cancel')}
            </Button>
            <Button onClick={save} data-testid="contract-save">
              {t('action.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
