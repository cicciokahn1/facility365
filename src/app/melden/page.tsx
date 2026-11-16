'use client';

/**
 * Oeffentliche Schadenmeldung fuer Mieterinnen und Mieter.
 *
 * Der QR-Code an der Liegenschaft fuehrt hierher - kein Login noetig.
 * Die Meldung wird direkt als Schaden im Modul angelegt.
 */
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, CheckCircle2, ImagePlus } from 'lucide-react';

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
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const pickPhoto = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto({ url: canvas.toDataURL('image/jpeg', 0.72), name: file.name });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

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
        body: JSON.stringify({ propertyId, ...form, photo: photo?.url ?? '', photoName: photo?.name ?? '' }),
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
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Foto vom Schaden (freiwillig)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => pickPhoto(event.target.files?.[0])}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => pickPhoto(event.target.files?.[0])}
            />
            {photo ? (
              <img
                src={photo.url}
                alt="Foto vom Schaden"
                className="max-h-40 w-fit rounded-md border object-cover"
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="size-4" aria-hidden />
                {photo ? 'Neues Foto aufnehmen' : 'Foto aufnehmen'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImagePlus className="size-4" aria-hidden />
                {photo ? 'Anderes Foto wählen' : 'Foto wählen'}
              </Button>
            </div>
          </div>
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
