'use client';

/**
 * Sammelbearbeitung mehrerer Termine.
 *
 * Nur ausgefuellte Felder werden uebernommen; leere Felder lassen den
 * bestehenden Wert unveraendert. Das Datum wirkt auf jeden Termin, die uebrigen
 * Felder nur auf eigene Kalendertermine.
 */
import { useState } from 'react';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarEvent } from '@/lib/calendar/events';
import { CalendarMutations } from '@/lib/calendar/mutations';
import { useT } from '@/lib/i18n/provider';
import { APPOINTMENT_STATUS_OPTIONS } from '@/lib/schema';

const KEEP = '__keep__';

export function CalendarBulkDialog({
  open,
  onOpenChange,
  events,
  mutations,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: CalendarEvent[];
  mutations: CalendarMutations;
  onDone: () => void;
}) {
  const t = useT();
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [location, setLocation] = useState('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState(KEEP);

  const reset = () => {
    setDate('');
    setShift('');
    setTimeStart('');
    setTimeEnd('');
    setLocation('');
    setAssignee('');
    setStatus(KEEP);
  };

  /** Datum um eine Anzahl Tage verschieben. */
  const shifted = (value: string, days: number): string => {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    parsed.setDate(parsed.getDate() + days);
    return parsed.toISOString().slice(0, 10);
  };

  const apply = () => {
    const days = Number(shift);
    const own: Record<string, unknown> = {};
    if (timeStart) own.timeStart = timeStart;
    if (timeEnd) own.timeEnd = timeEnd;
    if (location) own.location = location;
    if (assignee) own.assignee = assignee;
    if (status !== KEEP) own.status = status;

    let changed = 0;
    events.forEach((event) => {
      if (!mutations.canEdit(event)) return;
      const field = event.source?.field;
      const values: Record<string, unknown> = event.kind === 'appointment' ? { ...own } : {};
      if (field) {
        if (date) values[field] = date;
        else if (shift && Number.isFinite(days) && days !== 0)
          values[field] = shifted(event.date, days);
      }
      if (Object.keys(values).length === 0) return;
      mutations.patch(event, values);
      changed += 1;
    });

    if (changed === 0) {
      toast.info(t('bulk.nothing'));
      return;
    }
    toast.success(t('toast.saved'));
    reset();
    onOpenChange(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="calendar-bulk-dialog">
        <DialogHeader>
          <DialogTitle>{t('calendar.bulkEdit')}</DialogTitle>
          <DialogDescription>
            {events.length} · {t('calendar.bulkHint')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-date">{t('common.date')}</Label>
            <Input
              id="bulk-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              data-testid="calendar-bulk-date"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-shift">{t('calendar.shiftDays')}</Label>
            <Input
              id="bulk-shift"
              type="number"
              value={shift}
              onChange={(event) => setShift(event.target.value)}
              data-testid="calendar-bulk-shift"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-start">{t('work.start')}</Label>
            <Input
              id="bulk-start"
              type="time"
              value={timeStart}
              onChange={(event) => setTimeStart(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-end">{t('work.end')}</Label>
            <Input
              id="bulk-end"
              type="time"
              value={timeEnd}
              onChange={(event) => setTimeEnd(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-location">{t('common.location')}</Label>
            <Input
              id="bulk-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-assignee">{t('common.assignee')}</Label>
            <Input
              id="bulk-assignee"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('common.status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="calendar-bulk-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={KEEP}>{t('bulk.keep')}</SelectItem>
                {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('action.cancel')}
          </Button>
          <Button onClick={apply} data-testid="calendar-bulk-apply">
            {t('action.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
