'use client';

import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { Issuable, KeyMovement } from '@/lib/types';
import { formatDate, today } from '@/lib/utils/format';
import { newId } from '@/lib/utils/id';

export type MovementLabels = {
  issuedTo: TranslationKey;
  movements: TranslationKey;
  movementType: TranslationKey;
  person: TranslationKey;
  issue: TranslationKey;
  takeBack: TranslationKey;
  movementsEmpty: TranslationKey;
  historyIssued: TranslationKey;
  historyReturned: TranslationKey;
};

const defaultMovementLabels: MovementLabels = {
  issuedTo: 'keys.issuedTo',
  movements: 'keys.movements',
  movementType: 'keys.movementType',
  person: 'keys.person',
  issue: 'keys.issue',
  takeBack: 'keys.takeBack',
  movementsEmpty: 'keys.movementsEmpty',
  historyIssued: 'keys.historyIssued',
  historyReturned: 'keys.historyReturned',
};

/**
 * Bewegungen eines ausgegebenen Gegenstands.
 *
 * Ausgabe und Ruecknahme laufen ueber dieselbe Liste: jede Bewegung haelt
 * Person, Datum und Bemerkung fest und setzt zugleich Status, Ausgabe an,
 * Ausgabedatum und Rueckgabe.
 */
export function KeyMovements<T extends Issuable>({
  entity,
  onChange,
  labels = defaultMovementLabels,
}: {
  entity: T;
  onChange: (values: Partial<T>, action?: string) => void;
  labels?: MovementLabels;
}) {
  const t = useT();
  const { settings } = useSettings();
  const issued = entity.status === 'issued';
  const [person, setPerson] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');

  const append = (movement: KeyMovement, values: Partial<T>, action: string) => {
    onChange({ ...values, movements: [...entity.movements, movement] } as Partial<T>, action);
    setPerson('');
    setNote('');
    setDate(today());
  };

  const issue = () => {
    const name = person.trim();
    if (!name) return;
    append(
      { id: newId('movement'), type: 'issue', date, person: name, note: note.trim() },
      { status: 'issued', issuedTo: name, issuedAt: date, returnedAt: '' } as Partial<T>,
      labels.historyIssued,
    );
  };

  const takeBack = () => {
    append(
      { id: newId('movement'), type: 'return', date, person: entity.issuedTo, note: note.trim() },
      { status: 'available', returnedAt: date } as Partial<T>,
      labels.historyReturned,
    );
  };

  return (
    <section className="flex flex-col gap-4" data-testid="key-movements">
      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
        {issued ? (
          <div className="sm:col-span-3">
            <p className="text-sm">
              {t(labels.issuedTo)}: <span className="font-medium">{entity.issuedTo}</span>
              {entity.issuedAt ? ` · ${formatDate(entity.issuedAt, settings.language)}` : ''}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="movement-person">{t(labels.issuedTo)}</Label>
            <Input
              id="movement-person"
              value={person}
              onChange={(event) => setPerson(event.target.value)}
              data-testid="movement-person"
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="movement-date">{t('common.date')}</Label>
          <Input
            id="movement-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            data-testid="movement-date"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="movement-note">{t('common.notes')}</Label>
          <Input
            id="movement-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            data-testid="movement-note"
          />
        </div>
        <div className="flex items-end">
          {issued ? (
            <Button onClick={takeBack} data-testid="movement-return">
              <ArrowDownLeft className="size-4" aria-hidden />
              {t(labels.takeBack)}
            </Button>
          ) : (
            <Button onClick={issue} data-testid="movement-issue">
              <ArrowUpRight className="size-4" aria-hidden />
              {t(labels.issue)}
            </Button>
          )}
        </div>
      </div>

      {entity.movements.length === 0 ? (
        <EmptyState icon={ArrowUpRight} titleKey={labels.movementsEmpty} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">{t('common.date')}</th>
                <th className="py-2 pr-3 font-medium">{t(labels.movementType)}</th>
                <th className="py-2 pr-3 font-medium">{t(labels.person)}</th>
                <th className="py-2 pr-3 font-medium">{t('common.notes')}</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {[...entity.movements].reverse().map((movement) => (
                <tr key={movement.id} className="border-b last:border-0" data-testid="key-movement">
                  <td className="py-2 pr-3">{formatDate(movement.date, settings.language)}</td>
                  <td className="py-2 pr-3">
                    {t(movement.type === 'issue' ? labels.issue : labels.takeBack)}
                  </td>
                  <td className="py-2 pr-3">{movement.person}</td>
                  <td className="py-2 pr-3">{movement.note}</td>
                  <td className="py-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t('action.delete')}
                      onClick={() =>
                        onChange({
                          movements: entity.movements.filter((entry) => entry.id !== movement.id),
                        } as Partial<T>)
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
