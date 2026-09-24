'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection, useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { defaultValuesOf } from '@/lib/module-config';
import { useSettings } from '@/lib/settings/provider';
import { formatDate, today } from '@/lib/utils/format';
import { formatWorkTime, hasWorkTime, workedMinutes } from '@/lib/reports/work-time';

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const mondayOf = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return isoDate(date);
};

const addDays = (value: string, days: number) => {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
};

export function QuickWorkTime() {
  const t = useT();
  const router = useRouter();
  const { settings } = useSettings();
  const { create, remove, update } = useCollection('reports');
  const reports = useCollectionItems('reports');
  const [weekStart, setWeekStart] = useState(() => mondayOf(today()));
  const [date, setDate] = useState(today());
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const weekEnd = addDays(weekStart, 6);
  const entries = reports.filter((report) => {
    const own = !settings.profileName || report.author === settings.profileName;
    return (
      own &&
      !report.orderId &&
      hasWorkTime({
        start: report.workStart,
        end: report.workEnd,
        breakMinutes: report.breakMinutes,
      }) &&
      report.date >= weekStart &&
      report.date <= weekEnd
    );
  });
  const totalMinutes = entries.reduce(
    (sum, report) =>
      sum +
      workedMinutes({
        start: report.workStart,
        end: report.workEnd,
        breakMinutes: report.breakMinutes,
      }),
    0,
  );
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

  const resetForm = () => {
    setEditingId(null);
    setDate(today());
    setStart('');
    setEnd('');
    setBreakMinutes('0');
    setTitle('');
  };

  const save = () => {
    const values = {
      title: title.trim() || t('quickWorkTime.title'),
      date,
      workStart: start,
      workEnd: end,
      breakMinutes: Number(breakMinutes) || 0,
    };
    if (editingId) {
      update(editingId, values, 'history.workTimeCorrected', settings.profileName || settings.companyName);
    } else {
      create({
        ...defaultValuesOf('reports'),
        ...values,
        type: 'daily',
        status: 'draft',
        author: settings.profileName || settings.companyName,
      });
    }
    resetForm();
    router.push('/work-time');
  };

  const edit = (report: (typeof entries)[number]) => {
    setEditingId(report.id);
    setDate(report.date);
    setStart(report.workStart);
    setEnd(report.workEnd);
    setBreakMinutes(String(report.breakMinutes ?? 0));
    setTitle(report.title);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const deleteEntry = (report: (typeof entries)[number]) => {
    if (!window.confirm(t('detail.deleteText'))) return;
    remove(report.id);
    if (editingId === report.id) resetForm();
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <header>
        <Button
          variant="ghost"
          className="mb-2 -ml-3 w-fit gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('action.back')}
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{t('quickWorkTime.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('quickWorkTime.hint')}</p>
      </header>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">{t('quickWorkTime.week')}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label={t('quickWorkTime.previousWeek')}
              onClick={() => setWeekStart((value) => addDays(value, -7))}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('quickWorkTime.nextWeek')}
              onClick={() => setWeekStart((value) => addDays(value, 7))}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {formatDate(weekStart, settings.language)} – {formatDate(weekEnd, settings.language)}
          </p>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-3xl font-semibold">{totalHours} h</p>
            <p className="text-sm text-muted-foreground">{t('quickWorkTime.total')}</p>
          </div>
          <div className="space-y-2">
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('quickWorkTime.noEntries')}</p>
            ) : (
              entries
                .sort((left, right) => left.date.localeCompare(right.date))
                .map((report) => (
                    <div key={report.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{formatDate(report.date, settings.language)}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.workStart} – {report.workEnd}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatWorkTime({
                            start: report.workStart,
                            end: report.workEnd,
                            breakMinutes: report.breakMinutes,
                          })} h
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => edit(report)}
                          aria-label={t('action.edit')}
                          data-testid={`work-edit-${report.id}`}
                        >
                          {t('action.edit')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteEntry(report)}
                          aria-label={t('action.delete')}
                          data-testid={`work-delete-${report.id}`}
                        >
                          {t('action.delete')}
                        </Button>
                      </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? t('quickWorkTime.correct') : t('tab.workTime')}
            </CardTitle>
          </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="work-date">{t('common.date')}</Label>
            <Input id="work-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="work-title">{t('common.title')}</Label>
            <Input id="work-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('quickWorkTime.title')} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="work-start">{t('work.start')}</Label>
            <Input id="work-start" type="time" value={start} onChange={(event) => setStart(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="work-end">{t('work.end')}</Label>
            <Input id="work-end" type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="work-break">{t('work.break')}</Label>
            <Input id="work-break" type="number" min="0" value={breakMinutes} onChange={(event) => setBreakMinutes(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button onClick={save} disabled={!date || !start || !end}>
              {editingId ? t('quickWorkTime.correctSave') : t('action.save')}
            </Button>
            <Button
              variant="outline"
              onClick={() => (editingId ? resetForm() : router.back())}
            >
              {t('action.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
