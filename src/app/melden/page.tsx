'use client';

/**
 * Oeffentliche Schadenmeldung fuer Mieterinnen und Mieter.
 *
 * Der QR-Code an der Liegenschaft fuehrt hierher - kein Login noetig.
 * Die Meldung wird direkt als Schaden im Modul angelegt.
 */
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Info {
  name: string;
  address: string;
  buildings: { id: string; name: string }[];
}

function ReportForm() {
  const params = useSearchParams();
  const propertyId = params.get('p') ?? '';
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    buildingId: '',
    reporter: '',
    contact: '',
  });

  useEffect(() => {
    if (!propertyId) return;
    void fetch(`/api/damage-report?p=${encodeURIComponent(propertyId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Info | null) => {
        if (data?.name) setInfo(data);
        else setError('Der Link ist ungültig oder die Liegenschaft wurde entfernt.');
      })
      .catch(() => setError('Verbindung fehlgeschlagen.'));
  }, [propertyId]);

  const submit = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/damage-report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ propertyId, ...form }),
      });
      if (!response.ok) {
        setError('Die Meldung konnte nicht gesendet werden. Bitte erneut versuchen.');
        return;
      }
      setDone(true);
    } catch {
      setError('Verbindung fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof form, label: string, required = false) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">
        {label}
        {required ? ' *' : ''}
      </span>
      <Input
        value={form[key]}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
        required={required}
      />
    </label>
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header className="flex flex-col gap-1">
        <p className="text-2xl font-bold">Facility365</p>
        <h1 className="text-xl font-semibold">Schaden melden</h1>
        {info ? (
          <p className="text-sm text-muted-foreground">
            {info.name}
            {info.address ? ` – ${info.address}` : ''}
          </p>
        ) : null}
      </header>
      {done ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
          <CheckCircle2 className="size-12 text-emerald-600" aria-hidden />
          <p className="text-lg font-semibold">Danke für die Meldung!</p>
          <p className="text-sm text-muted-foreground">
            Ihre Meldung ist beim Hauswart eingegangen und wird so schnell wie möglich bearbeitet.
          </p>
        </div>
      ) : error && !info ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{error}</p>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {field('title', 'Was ist defekt?', true)}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Beschreibung *</span>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              required
              placeholder="z. B. Wasserhahn im Bad tropft seit gestern"
            />
          </label>
          {info && info.buildings.length > 1 ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Gebäude</span>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={form.buildingId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, buildingId: event.target.value }))
                }
              >
                <option value="">–</option>
                {info.buildings.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {field('reporter', 'Ihr Name')}
          {field('contact', 'Telefon oder E-Mail')}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" size="lg" disabled={busy || !form.title || !form.description}>
            {busy ? 'Wird gesendet …' : 'Meldung senden'}
          </Button>
        </form>
      )}
    </main>
  );
}

export default function MeldenPage() {
  return (
    <Suspense>
      <ReportForm />
    </Suspense>
  );
}
