'use client';

/**
 * Bewegungen eines Schluessels.
 *
 * Ausgabe und Ruecknahme laufen ueber dieselbe Liste: jede Bewegung haelt
 * Person, Datum und Bemerkung fest und setzt zugleich Status, Ausgabe an,
 * Ausgabedatum und Rueckgabe des Schluessels.
 */
import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { KeyEntity, KeyMovement } from '@/lib/types';
import { formatDate, today } from '@/lib/utils/format';
import { newId } from '@/lib/utils/id';

export function KeyMovements({
  entity,
  onChange,
}: {
  entity: KeyEntity;
  onChange: (values: Partial<KeyEntity>, action?: string) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const issued = entity.status === 'issued';
  const [person, setPerson] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');

  const append = (movement: KeyMovement, values: Partial<KeyEntity>, action: string) => {
    onChange({ ...values, movements: [...entity.movements, movement] }, action);
    setPerson('');
    setNote('');
    setDate(today());
  };

  /** Ausgabe: der Schluessel ist beim Empfaenger, die Rueckgabe wird zurueckgesetzt. */
  const issue = () => {
    const name = person.trim();
    if (!name) return;
    append(
      { id: newId('movement'), type: 'issue', date, person: name, note: note.trim() },
      { status: 'issued', issuedTo: name, issuedAt: date, returnedAt: '' },
      'keys.historyIssued',
    );
  };

  /** Ruecknahme: der Schluessel liegt wieder am Standort. */
  const takeBack = () => {
    append(
      { id: newId('movement'), type: 'return', date, person: entity.issuedTo, note: note.trim() },
      { status: 'available', returnedAt: date },
      'keys.historyReturned',
    );
  };

  return (
    <section className="flex flex-col gap-4" data-testid="key-movements">
      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
        {issued ? (
          <div className="sm:col-span-3">
            <p className="text-sm">
              {t('keys.issuedTo')}: <span className="font-medium">{entity.issuedTo}</span>
              {entity.issuedAt ? ` · ${formatDate(entity.issuedAt, settings.language)}` : ''}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="movement-person">{t('keys.issuedTo')}</Label>
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
              {t('keys.takeBack')}
            </Button>
          ) : (
            <Button onClick={issue} data-testid="movement-issue">
              <ArrowUpRight className="size-4" aria-hidden />
              {t('keys.issue')}
            </Button>
          )}
        </div>
      </div>

      {entity.movements.length === 0 ? (
        <EmptyState icon={ArrowUpRight} titleKey="keys.movementsEmpty" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">{t('common.date')}</th>
                <th className="py-2 pr-3 font-medium">{t('keys.movementType')}</th>
                <th className="py-2 pr-3 font-medium">{t('keys.person')}</th>
                <th className="py-2 pr-3 font-medium">{t('common.notes')}</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {[...entity.movements].reverse().map((movement) => (
                <tr key={movement.id} className="border-b last:border-0" data-testid="key-movement">
                  <td className="py-2 pr-3">{formatDate(movement.date, settings.language)}</td>
                  <td className="py-2 pr-3">
                    {t(movement.type === 'issue' ? 'keys.issue' : 'keys.takeBack')}
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
                        })
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
