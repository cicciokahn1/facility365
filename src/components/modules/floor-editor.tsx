'use client';

/** Stockwerke eines Gebaeudes; sortiert von oben nach unten. */
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/provider';
import { BuildingFloor } from '@/lib/types';
import { newId } from '@/lib/utils/id';

export function FloorEditor({
  floors,
  onChange,
}: {
  floors: BuildingFloor[];
  onChange: (floors: BuildingFloor[]) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState({
    name: '',
    level: '0',
    area: '',
    grossArea: '',
    netArea: '',
    usableArea: '',
  });
  const sorted = [...floors].sort((a, b) => b.level - a.level);

  const add = () => {
    const name = draft.name.trim();
    if (!name) return;
    onChange([
      ...floors,
      {
        id: newId('floor'),
        name,
        level: Number(draft.level) || 0,
        area: draft.area ? Number(draft.area.replace(',', '.')) : undefined,
        grossArea: draft.grossArea ? Number(draft.grossArea.replace(',', '.')) : undefined,
        netArea: draft.netArea ? Number(draft.netArea.replace(',', '.')) : undefined,
        usableArea: draft.usableArea ? Number(draft.usableArea.replace(',', '.')) : undefined,
        note: '',
      },
    ]);
    setDraft({ name: '', level: '0', area: '', grossArea: '', netArea: '', usableArea: '' });
  };

  return (
    <section className="flex flex-col gap-3" data-testid="floor-editor">
      {sorted.length === 0 ? (
        <EmptyState titleKey="floor.empty" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {sorted.map((floor) => (
            <li key={floor.id} className="flex items-center gap-3 p-3" data-testid="floor-item">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-accent-foreground">
                {floor.level}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{floor.name}</span>
                {typeof floor.area === 'number' ? (
                  <span className="block text-xs text-muted-foreground">
                    {floor.area} m²
                    {typeof floor.netArea === 'number' ? ` · NF ${floor.netArea} m²` : ''}
                    {typeof floor.usableArea === 'number' ? ` · HNF ${floor.usableArea} m²` : ''}
                  </span>
                ) : null}
              </span>
              <Button
                size="icon"
                variant="ghost"
                aria-label={t('action.delete')}
                onClick={() => onChange(floors.filter((entry) => entry.id !== floor.id))}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        <Input
          placeholder={t('common.name')}
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          data-testid="floor-name"
        />
        <Input
          type="number"
          placeholder={t('floor.level')}
          value={draft.level}
          onChange={(event) => setDraft({ ...draft, level: event.target.value })}
          data-testid="floor-level"
        />
        <Input
          inputMode="decimal"
          placeholder={t('common.area')}
          value={draft.area}
          onChange={(event) => setDraft({ ...draft, area: event.target.value })}
        />
        <Input
          inputMode="decimal"
          placeholder="GF m²"
          value={draft.grossArea}
          onChange={(event) => setDraft({ ...draft, grossArea: event.target.value })}
        />
        <Input
          inputMode="decimal"
          placeholder="NF m²"
          value={draft.netArea}
          onChange={(event) => setDraft({ ...draft, netArea: event.target.value })}
        />
        <Input
          inputMode="decimal"
          placeholder="HNF m²"
          value={draft.usableArea}
          onChange={(event) => setDraft({ ...draft, usableArea: event.target.value })}
        />
        <Button onClick={add} data-testid="floor-add">
          <Plus className="size-4" aria-hidden />
          {t('action.add')}
        </Button>
      </div>
    </section>
  );
}
