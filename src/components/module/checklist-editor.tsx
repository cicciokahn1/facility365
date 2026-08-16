'use client';

/** Checkliste mit Fortschritt; abhaken, ergaenzen, entfernen. */
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useT } from '@/lib/i18n/provider';
import { ChecklistItem } from '@/lib/types';
import { newId } from '@/lib/utils/id';

export function ChecklistEditor({
  items,
  onChange,
}: {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}) {
  const t = useT();
  const [text, setText] = useState('');
  const done = items.filter((item) => item.done).length;

  const add = () => {
    const value = text.trim();
    if (!value) return;
    onChange([...items, { id: newId('chk'), text: value, done: false }]);
    setText('');
  };

  return (
    <section className="flex flex-col gap-3" data-testid="checklist">
      {items.length > 0 ? (
        <div className="flex items-center gap-3">
          <Progress value={(done / items.length) * 100} className="h-2" />
          <span className="shrink-0 text-sm text-muted-foreground">
            {done}/{items.length}
          </span>
        </div>
      ) : null}

      <ul className="divide-y rounded-xl border bg-card">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 p-3">
            <Checkbox
              checked={item.done}
              onCheckedChange={(checked) =>
                onChange(
                  items.map((entry) =>
                    entry.id === item.id ? { ...entry, done: checked === true } : entry,
                  ),
                )
              }
              aria-label={item.text}
            />
            <span className={item.done ? 'flex-1 text-muted-foreground line-through' : 'flex-1'}>
              {item.text}
            </span>
            <Button
              size="icon"
              variant="ghost"
              aria-label={t('action.delete')}
              onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </li>
        ))}
        <li className="flex items-center gap-2 p-3">
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') add();
            }}
            placeholder={t('tab.checklist')}
            data-testid="checklist-input"
          />
          <Button onClick={add} data-testid="checklist-add">
            <Plus className="size-4" aria-hidden />
            {t('action.add')}
          </Button>
        </li>
      </ul>
    </section>
  );
}
