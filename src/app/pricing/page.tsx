'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SUPPORT_EMAIL } from '@/lib/branding/support';
import {
  disabledByPackage,
  OPTIONAL_MODULES,
  packageLabelKey,
  packagePrice,
  PACKAGE_KEYS,
} from '@/lib/packages/packages';
import { moduleByKey } from '@/lib/modules';
import { useT } from '@/lib/i18n/provider';
import type { IndustryPackage, ModuleKey } from '@/lib/types';
import { formatMoney } from '@/lib/utils/format';

export default function PricingPage() {
  const t = useT();
  const packages = PACKAGE_KEYS.filter((key) => key && key !== 'custom');
  const [selectedPackage, setSelectedPackage] = useState<IndustryPackage>('professional');
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(
    OPTIONAL_MODULES.filter((module) => !disabledByPackage('professional').includes(module)),
  );
  const [contact, setContact] = useState({ name: '', company: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const selectedModuleLabels = useMemo(
    () => selectedModules.map((module) => t(moduleByKey(module).labelKey)),
    [selectedModules, t],
  );
  const offerHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Facility365 Angebot – ${t(packageLabelKey(selectedPackage))}`,
  )}&body=${encodeURIComponent(
    `Paket: ${t(packageLabelKey(selectedPackage))}\n\nGewünschte Module:\n${selectedModuleLabels.join('\n')}`,
  )}`;

  const choosePackage = (key: IndustryPackage) => {
    setSelectedPackage(key);
    setSelectedModules(
      OPTIONAL_MODULES.filter((module) => !disabledByPackage(key).includes(module)),
    );
  };

  const toggleModule = (module: ModuleKey, checked: boolean) => {
    setSelectedModules((current) =>
      checked ? [...current, module] : current.filter((item) => item !== module),
    );
  };

  const submitOffer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/offer-request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: contact.name,
        company: contact.company,
        email: contact.email,
        package: t(packageLabelKey(selectedPackage)),
        modules: selectedModuleLabels,
        message: contact.message,
      }),
    }).catch(() => null);
    if (response?.ok) {
      setSubmitted(true);
      return;
    }
    const body = [
      `Name: ${contact.name}`,
      `Firma: ${contact.company}`,
      `E-Mail: ${contact.email}`,
      '',
      `Paket: ${t(packageLabelKey(selectedPackage))}`,
      '',
      'Gewünschte Module:',
      ...selectedModuleLabels,
      '',
      contact.message ? `Nachricht:\n${contact.message}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      `Facility365 Angebotsanfrage – ${contact.company || contact.name}`,
    )}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="text-center">
          <p className="text-sm font-medium text-primary">Facility365</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Preise und Angebot</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Paket auswählen, benötigte Module anklicken und direkt ein persönliches Angebot anfordern.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>1. Paket auswählen</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((key) => {
              const price = packagePrice(key);
              const selected = key === selectedPackage;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  className={`rounded-lg border p-4 text-left transition ${
                    selected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-muted'
                  }`}
                  onClick={() => choosePackage(key)}
                >
                  <p className="font-medium">{t(packageLabelKey(key))}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {price?.yearly ? `${formatMoney(price.yearly)} / Jahr` : 'Individuelles Angebot'}
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2. Module auswählen</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OPTIONAL_MODULES.map((module) => (
              <label
                key={module}
                className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 hover:bg-muted"
              >
                <Checkbox
                  checked={selectedModules.includes(module)}
                  onCheckedChange={(checked) => toggleModule(module, checked === true)}
                />
                <span className="text-sm">{t(moduleByKey(module).labelKey)}</span>
              </label>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>3. Angebot anfordern</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitOffer}>
              <div className="grid gap-2">
                <Label htmlFor="offer-name">Name</Label>
                <Input
                  id="offer-name"
                  required
                  value={contact.name}
                  onChange={(event) => setContact({ ...contact, name: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="offer-company">Firma</Label>
                <Input
                  id="offer-company"
                  required
                  value={contact.company}
                  onChange={(event) => setContact({ ...contact, company: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="offer-email">E-Mail</Label>
                <Input
                  id="offer-email"
                  type="email"
                  required
                  value={contact.email}
                  onChange={(event) => setContact({ ...contact, email: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="offer-message">Nachricht (optional)</Label>
                <Textarea
                  id="offer-message"
                  value={contact.message}
                  onChange={(event) => setContact({ ...contact, message: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center">
                <Button type="submit" size="lg">
                  Auswahl als Angebot anfordern
                </Button>
                {submitted && (
                  <p className="text-sm text-muted-foreground">
                    Danke! Die Angebotsanfrage wurde gesendet. Wir melden uns mit einem persönlichen
                    Angebot.
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((key) => {
            const price = packagePrice(key);
            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{t(packageLabelKey(key))}</CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-40 flex-col gap-4">
                  <p className="text-2xl font-semibold">
                    {price?.yearly ? `${formatMoney(price.yearly)} / Jahr` : 'Individuelles Angebot'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Module nach Bedarf auswählen und ein persönliches Angebot erhalten.
                  </p>
                  <Button asChild className="mt-auto">
                    <a href={key === selectedPackage ? offerHref : `mailto:${SUPPORT_EMAIL}`}>
                      Angebot anfordern
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Preisübersicht</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Paket</th>
                  <th className="px-3 py-3 font-medium">Pro Jahr</th>
                  <th className="px-3 py-3 font-medium">Umgerechnet pro Monat</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((key) => {
                  const price = packagePrice(key);
                  return (
                    <tr key={key} className="border-b last:border-0">
                      <td className="px-3 py-3 font-medium">{t(packageLabelKey(key))}</td>
                      <td className="px-3 py-3">
                        {price?.yearly ? formatMoney(price.yearly) : 'Auf Anfrage'}
                      </td>
                      <td className="px-3 py-3">
                        {price?.yearly ? formatMoney(price.yearly / 12) : 'Auf Anfrage'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <Button asChild size="lg">
            <a href={offerHref}>Auswahl als Angebot anfordern</a>
          </Button>
        </div>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/login">Zur Anmeldung</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
