'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { defaultValuesOf } from '@/lib/module-config';
import { useSettings } from '@/lib/settings/provider';
import { today } from '@/lib/utils/format';

export function QuickWorkTime() {
  const t = useT();
  const router = useRouter();
  const { settings } = useSettings();
  const { create } = useCollection('reports');
  const [date, setDate] = useState(today());
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [title, setTitle] = useState('');

  const save = () => {
    const report = create({
      ...defaultValuesOf('reports'),
      title: title.trim() || t('quickWorkTime.title'),
      type: 'daily',
      status: 'draft',
      date,
      author: settings.profileName || settings.companyName,
      workStart: start,
      workEnd: end,
      breakMinutes: Number(breakMinutes) || 0,
    });
    router.push(`/reports/${report.id}`);
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
        <CardHeader><CardTitle className="text-base">{t('tab.workTime')}</CardTitle></CardHeader>
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
            <Button onClick={save} disabled={!date || !start || !end}>{t('action.save')}</Button>
            <Button variant="outline" onClick={() => router.push('/reports')}>{t('action.cancel')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
