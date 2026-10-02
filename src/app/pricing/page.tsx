import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { packagePrice, PACKAGE_KEYS } from '@/lib/packages/packages';
import { SUPPORT_EMAIL } from '@/lib/branding/support';
import { formatMoney } from '@/lib/utils/format';

const packageLabels: Record<string, string> = {
  professional: 'Hauswart und Facility Management',
  property: 'Immobilienverwaltung',
  care: 'Pflege und Betreuung',
  institution: 'Institutionen',
  industry: 'Industrie',
  public: 'Gemeinden und öffentliche Verwaltung',
  enterprise: 'Enterprise',
};

export default function PricingPage() {
  const packages = PACKAGE_KEYS.filter((key) => key && key !== 'custom');

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="text-center">
          <p className="text-sm font-medium text-primary">Facility365</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Preise und Angebot</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Wählen Sie die passende Fachrichtung. Die benötigten Module können später individuell
            angepasst werden.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((key) => {
            const price = packagePrice(key);
            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{packageLabels[key]}</CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-40 flex-col gap-4">
                  <p className="text-2xl font-semibold">
                    {price?.yearly ? `${formatMoney(price.yearly)} / Jahr` : 'Individuelles Angebot'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Module nach Bedarf auswählen und ein persönliches Angebot erhalten.
                  </p>
                  <Button asChild className="mt-auto">
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=Facility365%20Angebot`}>
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
                  <th className="px-3 py-3 font-medium">Einrichtung</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((key) => {
                  const price = packagePrice(key);
                  return (
                    <tr key={key} className="border-b last:border-0">
                      <td className="px-3 py-3 font-medium">{packageLabels[key]}</td>
                      <td className="px-3 py-3">
                        {price?.yearly ? formatMoney(price.yearly) : 'Auf Anfrage'}
                      </td>
                      <td className="px-3 py-3">
                        {price?.yearly ? formatMoney(price.yearly / 12) : 'Auf Anfrage'}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">Nach Bedarf</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/login">Zur Anmeldung</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
