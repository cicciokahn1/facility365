'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Plus } from 'lucide-react';
import { SUPPORT_EMAIL } from '@/lib/branding/support';
import {
  addonModulesOf,
  ADDON_PRICES,
  CATALOG_ORDER,
  firstYearTotal,
  includedGroupsOf,
  MODULE_GROUPS,
  monthlyPrice,
  PACKAGE_INFO,
  SETUP_FEES,
  SETUP_INCLUDED,
  yearlyPrice,
} from '@/lib/packages/catalog';
import { disabledByPackage, packageLabelKey } from '@/lib/packages/packages';
import { moduleByKey } from '@/lib/modules';
import { useT } from '@/lib/i18n/provider';
import type { IndustryPackage, ModuleKey } from '@/lib/types';
import { formatMoney } from '@/lib/utils/format';

type PackageKey = (typeof CATALOG_ORDER)[number];

/** Pakete mit festem Jahrespreis, die direkt gekauft werden koennen. */
const SELLABLE: PackageKey[] = [
  'starter',
  'property',
  'industry',
  'care',
  'public',
  'professional',
];

const money = (value: number | null): string =>
  value === null ? 'Auf Anfrage' : formatMoney(value);

const MonthlyPrice = ({ pkg }: { pkg: PackageKey }) => {
  const monthly = monthlyPrice(pkg);
  if (monthly === null) return <p className="text-xl font-semibold">Individuelles Angebot</p>;
  return (
    <p>
      {PACKAGE_INFO[pkg].priceFrom && (
        <span className="text-sm font-medium text-muted-foreground">ab </span>
      )}
      <span className="text-2xl font-semibold">{formatMoney(monthly)}</span>
      <span className="text-sm text-muted-foreground"> / Monat</span>
    </p>
  );
};

export default function PricingPage() {
  const t = useT();
  const [selectedPackage, setSelectedPackage] = useState<PackageKey>('property');
  const [selectedAddons, setSelectedAddons] = useState<ModuleKey[]>([]);
  const [contact, setContact] = useState({ name: '', company: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const addons = addonModulesOf(selectedPackage);
  const addonLabels = useMemo(
    () => selectedAddons.map((module) => t(moduleByKey(module).labelKey)),
    [selectedAddons, t],
  );

  /** Live-Preisschaetzung: Paket-Monatspreis + gewaehlte Zusatzmodule. */
  const addonMonthly = selectedAddons.reduce(
    (sum, module) => sum + (ADDON_PRICES[module] ?? 0),
    0,
  );
  const packageMonthly = monthlyPrice(selectedPackage);
  const estimateMonthly = (packageMonthly ?? 0) + addonMonthly;

  const offerHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Facility365 Angebot – ${t(packageLabelKey(selectedPackage))}`,
  )}&body=${encodeURIComponent(
    `Paket: ${t(packageLabelKey(selectedPackage))}\n\nZusatzmodule:\n${addonLabels.join('\n') || '–'}`,
  )}`;

  const choosePackage = (key: PackageKey) => {
    setSelectedPackage(key);
    setSelectedAddons([]);
  };

  const toggleAddon = (module: ModuleKey, checked: boolean) =>
    setSelectedAddons((current) =>
      checked ? [...current, module] : current.filter((item) => item !== module),
    );

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
        modules: addonLabels,
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
      'Zusatzmodule:',
      ...(addonLabels.length ? addonLabels : ['–']),
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
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="text-center">
          <p className="text-sm font-medium text-primary">Facility365</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Preise und Pakete</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Jedes Paket ist fuer eine Branche zugeschnitten – vom Starter-Paket fuer einzelne
            Hauswarte bis zum Komplettpaket Professional. Waehlen Sie das passende Paket,
            ergaenzen Sie bei Bedarf Zusatzmodule und fordern Sie ein persoenliches Angebot an.
            Alle Preise in CHF, exkl. MwSt.
          </p>
          <div className="mx-auto mt-4 flex max-w-2xl flex-col items-center gap-1 text-sm">
            <p className="font-medium text-primary">
              30 Tage kostenlos testen – keine Kreditkarte erforderlich
            </p>
            <p className="text-muted-foreground">
              Einfaches Jahres-Abo · Keine Gebühren pro Gebäude oder Liegenschaft
            </p>
          </div>
        </header>

        {/* Paketkarten */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {CATALOG_ORDER.map((key) => {
            const pkg = PACKAGE_INFO[key];
            const selected = key === selectedPackage;
            const setup = SETUP_FEES[key];
            const total = firstYearTotal(key);
            return (
              <Card
                key={key}
                className={selected ? 'border-primary ring-2 ring-primary/20' : ''}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start justify-between gap-2 text-lg">
                    <span>{t(packageLabelKey(key))}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                      {pkg.target.includes('Gemeinden') ? 'Oeffentlich' : 'Unternehmen'}
                    </span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{pkg.summary}</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <MonthlyPrice pkg={key} />
                    {yearlyPrice(key) !== null && (
                      <p className="text-xs text-muted-foreground">
                        umgerechneter Monatspreis – Abrechnung erfolgt als Jahresrechnung (
                        {PACKAGE_INFO[key].priceFrom ? 'ab ' : ''}
                        {formatMoney(yearlyPrice(key)!)}/Jahr)
                      </p>
                    )}
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Fuer:</span> {pkg.target}
                  </p>
                  <p className="text-sm text-muted-foreground">{pkg.benefit}</p>
                  <div className="text-sm">
                    <p className="font-medium">Enthaltene Bereiche</p>
                    <ul className="mt-1 space-y-1">
                      {includedGroupsOf(key).map((group) => (
                        <li key={group.title} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 text-primary" aria-hidden />
                          <span>
                            <span className="font-medium">{group.title}</span>{' '}
                            <span className="text-muted-foreground">– {group.description}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {addonModulesOf(key).length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Nicht enthalten:</span>{' '}
                        {addonModulesOf(key)
                          .slice(0, 6)
                          .map((module) => t(moduleByKey(module).labelKey))
                          .join(', ')}
                        {addonModulesOf(key).length > 6 && ' …'} – unten als Zusatzmodul
                        zubuchbar.
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p>
                      <span className="font-medium">Einmalige Einrichtung:</span>{' '}
                      {setup === null ? 'im Angebot ausgewiesen' : formatMoney(setup)}
                    </p>
                    <p>
                      <span className="font-medium">Kosten Jahr 1:</span>{' '}
                      {total === null
                        ? 'nach Angebot'
                        : setup === null
                          ? `${formatMoney(total)} + Einrichtung`
                          : formatMoney(total)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{pkg.whyThis}</p>
                  <div className="mt-auto flex flex-col gap-2">
                    <Button
                      variant={selected ? 'default' : 'outline'}
                      onClick={() => choosePackage(key)}
                      aria-pressed={selected}
                    >
                      {selected ? 'Ausgewählt' : 'Paket wählen'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Vergleichstabelle */}
        <Card>
          <CardHeader>
            <CardTitle>Paketvergleich</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Bereich</th>
                  {CATALOG_ORDER.map((key) => (
                    <th key={key} className="px-3 py-3 font-medium">
                      {t(packageLabelKey(key)).replace('Facility365 ', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['structure', 'technics', 'controls', 'cleaning', 'commerce'] as const).map(
                  (groupKey) => (
                    <tr key={groupKey} className="border-b">
                      <td className="px-3 py-3 font-medium">{MODULE_GROUPS[groupKey].title}</td>
                      {CATALOG_ORDER.map((key) => (
                        <td key={key} className="px-3 py-3">
                          {PACKAGE_INFO[key].groups.includes(groupKey) ? (
                            <Check className="size-4 text-primary" aria-label="enthalten" />
                          ) : (
                            <Plus className="size-4 text-muted-foreground" aria-label="Zusatzmodul" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ),
                )}
                {(
                  [
                    'contracts',
                    'analytics',
                    'portal',
                    'vehicles',
                    'visitors',
                    'hazards',
                    'waste',
                    'parking',
                  ] as ModuleKey[]
                ).map((module) => (
                  <tr key={module} className="border-b">
                    <td className="px-3 py-3 font-medium">
                      {t(moduleByKey(module).labelKey)}
                    </td>
                    {CATALOG_ORDER.map((key) => (
                      <td key={key} className="px-3 py-3">
                        {!disabledByPackage(key).includes(module) ? (
                          <Check className="size-4 text-primary" aria-label="enthalten" />
                        ) : module === 'waste' ? (
                          <span className="text-muted-foreground">–</span>
                        ) : (
                          <Plus className="size-4 text-muted-foreground" aria-label="Zusatzmodul" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b">
                  <td className="px-3 py-3 font-medium">Monatspreis</td>
                  {CATALOG_ORDER.map((key) => (
                    <td key={key} className="px-3 py-3">
                      {money(monthlyPrice(key))}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="px-3 py-3 font-medium">Jahrespreis</td>
                  {CATALOG_ORDER.map((key) => (
                    <td key={key} className="px-3 py-3">
                      {PACKAGE_INFO[key].priceFrom && yearlyPrice(key) !== null
                        ? `ab ${money(yearlyPrice(key))}`
                        : money(yearlyPrice(key))}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-3 font-medium">Einrichtung (einmalig)</td>
                  {CATALOG_ORDER.map((key) => (
                    <td key={key} className="px-3 py-3">
                      {SETUP_FEES[key] === null ? 'im Angebot' : formatMoney(SETUP_FEES[key]!)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              Legende: Haeckchen = im Paket enthalten, Plus = als Zusatzmodul zubuchbar.
              Grundfunktionen (Dashboard, Kalender, Kunden, Liegenschaften, Auftraege,
              Schaeden, Rapporte, Benutzer) sind in jedem Paket enthalten.
            </p>
          </CardContent>
        </Card>

        {/* Zusatzmodule */}
        <Card>
          <CardHeader>
            <CardTitle>2. Zusatzmodule (optional)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((module) => {
              const price = ADDON_PRICES[module];
              return (
                <label
                  key={module}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 hover:bg-muted"
                >
                  <Checkbox
                    checked={selectedAddons.includes(module)}
                    onCheckedChange={(checked) => toggleAddon(module, checked === true)}
                  />
                  <span className="flex-1 text-sm">{t(moduleByKey(module).labelKey)}</span>
                  <span className="text-xs text-muted-foreground">
                    {price === undefined ? 'auf Anfrage' : `+ ${formatMoney(price)}/Mt.`}
                  </span>
                </label>
              );
            })}
            {addons.length === 0 && (
              <p className="text-sm text-muted-foreground sm:col-span-3">
                Dieses Paket enthaelt bereits alle verfuegbaren Module.
              </p>
            )}
            {addonMonthly > 0 && (
              <p className="text-sm font-medium sm:col-span-3">
                Gewählte Zusatzmodule: + {formatMoney(addonMonthly)}/Mt.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Preisschaetzung */}
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle>Geschätzte Kosten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {packageMonthly !== null ? (
              <>
                <p>
                  Paket: {formatMoney(packageMonthly)}/Mt. ({formatMoney(yearlyPrice(selectedPackage)!)}/Jahr)
                </p>
                <p>Zusatzmodule: + {formatMoney(addonMonthly)}/Mt.</p>
                <p className="pt-1 text-lg font-semibold">
                  Total: {formatMoney(estimateMonthly)}/Mt. ·{' '}
                  {formatMoney(estimateMonthly * 12)}/Jahr
                </p>
              </>
            ) : (
              <>
                <p>Gewählte Module: {formatMoney(addonMonthly)}/Mt. (Richtwert)</p>
                <p className="pt-1 text-lg font-semibold">
                  Der Gesamtpreis wird nach deiner Auswahl individuell offeriert.
                </p>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              Schätzung ohne Einrichtung – die genauen Konditionen stehen im persönlichen Angebot.
            </p>
          </CardContent>
        </Card>

        {/* Einrichtung */}
        <Card>
          <CardHeader>
            <CardTitle>Einrichtung (einmalig)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {SETUP_INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Datenuebernahme, umfangreiche Schulungen und individuelle Konfiguration werden
              bei Bedarf separat offeriert. Die genauen Einrichtungsbeträge richten sich nach
              Paket und Aufwand und werden transparent im persoenlichen Angebot ausgewiesen.
            </p>
          </CardContent>
        </Card>

        {/* Angebotsformular */}
        <Card>
          <CardHeader>
            <CardTitle>3. Angebot anfordern</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Auswahl: <strong>{t(packageLabelKey(selectedPackage))}</strong>
              {selectedAddons.length > 0 && ` + ${addonLabels.join(', ')}`}
            </p>
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
                  Angebot anfordern
                </Button>
                {submitted && (
                  <p className="text-sm text-muted-foreground">
                    Danke! Die Angebotsanfrage wurde gesendet. Wir melden uns mit einem
                    persoenlichen Angebot.
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-3">
          <Button asChild size="lg">
            <a href={offerHref}>Auswahl per E-Mail anfordern</a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Zur Anmeldung</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
